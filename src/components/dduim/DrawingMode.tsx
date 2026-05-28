import { useEffect, useRef, useState } from "react";
import type { Course, LatLngLiteral } from "@/lib/dduim/types";
import { PACE_PRESETS, TAG_CATALOG } from "@/lib/dduim/data";
import { calcGeoDistance, createCourseId, deriveNormalizedPath, generateReturnPath, smoothedPath } from "@/lib/dduim/utils";
import { IconClock } from "./icons";
import {
  loadKakaoMap,
  type KakaoMarker,
  type KakaoMap,
  type KakaoPolyline,
} from "@/lib/kakao/load-kakao-map";
import { reverseGeocode } from "@/lib/kakao/reverse-geocode";

const DEFAULT_CENTER = { lat: 37.52693, lng: 126.93447, level: 5 };

export function DrawingMode({ onExit, onSave, initialCenter }: {
  onExit: () => void;
  onSave: (course: Course) => void;
  initialCenter?: { lat: number; lng: number; level?: number };
}) {
  const [geoPoints, setGeoPoints] = useState<LatLngLiteral[]>([]);
  const [addressShort, setAddressShort] = useState("");
  const [paceId, setPaceId] = useState<"walk" | "jog" | "run" | "fast">("jog");
  const [stage, setStage] = useState<"draw" | "details">("draw");
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [returnPointIdx, setReturnPointIdx] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const polylineRef = useRef<KakaoPolyline | null>(null);
  const returnPolylineRef = useRef<KakaoPolyline | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const returnMarkerRef = useRef<KakaoMarker | null>(null);
  const initialCenterRef = useRef(initialCenter);
  const returnPointIdxRef = useRef<number | null>(null);

  // returnPointIdx ref 동기화 (map click handler에서 사용)
  useEffect(() => {
    returnPointIdxRef.current = returnPointIdx;
  }, [returnPointIdx]);

  const pace = PACE_PRESETS.find(p => p.id === paceId) || PACE_PRESETS[1];
  const km = calcGeoDistance(geoPoints);
  const minsRounded = Math.max(1, Math.round(km * pace.pace));
  const canSave = geoPoints.length >= 2 && km > 0.05;
  const normalizedPath = deriveNormalizedPath(geoPoints);
  const smoothD = smoothedPath(normalizedPath);

  const firstLat = geoPoints[0]?.lat;
  const firstLng = geoPoints[0]?.lng;

  // 시작점이 바뀔 때마다 역지오코딩으로 약식 주소 갱신
  useEffect(() => {
    if (firstLat === undefined || firstLng === undefined) return;
    let cancelled = false;
    reverseGeocode(firstLat, firstLng).then(addr => {
      if (!cancelled) setAddressShort(addr);
    });
    return () => { cancelled = true; };
  }, [firstLat, firstLng]);

  // 카카오 지도 초기화 및 클릭 이벤트 등록
  useEffect(() => {
    let cancelled = false;
    loadKakaoMap()
      .then(maps => {
        if (cancelled || !mapContainerRef.current) return;
        const center = initialCenterRef.current ?? DEFAULT_CENTER;
        const map = new maps.Map(mapContainerRef.current, {
          center: new maps.LatLng(center.lat, center.lng),
          level: center.level ?? 5,
        });
        mapRef.current = map;
        maps.event.addListener(map, "click", (mouseEvent) => {
          if (cancelled || returnPointIdxRef.current !== null) return;
          const latlng = mouseEvent.latLng;
          setGeoPoints(prev => [...prev, { lat: latlng.getLat(), lng: latlng.getLng() }]);
        });
        setMapReady(true);
      })
      .catch(() => { if (!cancelled) setMapFailed(true); });

    return () => {
      cancelled = true;
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      returnPolylineRef.current?.setMap(null);
      returnPolylineRef.current = null;
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      returnMarkerRef.current?.setMap(null);
      returnMarkerRef.current = null;
    };
  }, []);

  // 폴리라인 업데이트 (전진 경로 + 복귀 경로)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let alive = true;
    loadKakaoMap().then(maps => {
      if (!alive || !mapRef.current) return;
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      returnPolylineRef.current?.setMap(null);
      returnPolylineRef.current = null;
      if (geoPoints.length < 2) return;

      const splitIdx = returnPointIdx ?? geoPoints.length - 1;
      const forwardPoints = geoPoints.slice(0, splitIdx + 1);

      polylineRef.current = new maps.Polyline({
        map: mapRef.current,
        path: forwardPoints.map(p => new maps.LatLng(p.lat, p.lng)),
        strokeWeight: 5,
        strokeColor: "#6FC2A6",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });

      if (returnPointIdx !== null && geoPoints.length > returnPointIdx + 1) {
        const returnSegment = geoPoints.slice(returnPointIdx);
        returnPolylineRef.current = new maps.Polyline({
          map: mapRef.current,
          path: returnSegment.map(p => new maps.LatLng(p.lat, p.lng)),
          strokeWeight: 4,
          strokeColor: "#6FC2A6",
          strokeOpacity: 0.5,
          strokeStyle: "dashed",
        });
      }
    });
    return () => { alive = false; };
  }, [geoPoints, mapReady, returnPointIdx]);

  // 마커 업데이트 (전진 경로 점만 드래그 가능, 반환점 전용 마커)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let alive = true;
    loadKakaoMap().then(maps => {
      if (!alive || !mapRef.current) return;
      markersRef.current.forEach(m => m.setMap(null));
      returnMarkerRef.current?.setMap(null);
      returnMarkerRef.current = null;

      const forwardPoints = returnPointIdx !== null
        ? geoPoints.slice(0, returnPointIdx + 1)
        : geoPoints;

      markersRef.current = forwardPoints.map((pt, i) => {
        const isStart = i === 0;
        const isEnd = i === forwardPoints.length - 1 && forwardPoints.length > 1;
        const sz = isStart ? 28 : isEnd ? 22 : 10;
        const image = new maps.MarkerImage(makeSvgMarkerUrl(isStart, isEnd), new maps.Size(sz, sz));
        const marker = new maps.Marker({
          map: mapRef.current!,
          position: new maps.LatLng(pt.lat, pt.lng),
          draggable: returnPointIdx === null,
          image,
          zIndex: isStart ? 30 : isEnd ? 25 : 20,
        });
        if (returnPointIdx === null) {
          maps.event.addListener(marker, "dragend", () => {
            if (!alive) return;
            const pos = marker.getPosition();
            setGeoPoints(prev => {
              const updated = [...prev];
              updated[i] = { lat: pos.getLat(), lng: pos.getLng() };
              return updated;
            });
          });
        }
        return marker;
      });

      // 반환점 전용 마커
      if (returnPointIdx !== null && geoPoints[returnPointIdx]) {
        const pt = geoPoints[returnPointIdx];
        const image = new maps.MarkerImage(makeTurnaroundMarkerUrl(), new maps.Size(30, 30));
        returnMarkerRef.current = new maps.Marker({
          map: mapRef.current!,
          position: new maps.LatLng(pt.lat, pt.lng),
          draggable: false,
          image,
          zIndex: 35,
        });
      }
    });
    return () => { alive = false; };
  }, [geoPoints, mapReady, returnPointIdx]);

  // 왕복 경로 활성화
  const handleActivateReturn = () => {
    if (geoPoints.length < 2 || returnPointIdx !== null) return;
    const idx = geoPoints.length - 1;
    const returnPoints = generateReturnPath(geoPoints);
    setReturnPointIdx(idx);
    setGeoPoints(prev => [...prev, ...returnPoints]);
  };

  // 왕복 모드 취소
  const handleCancelReturn = () => {
    if (returnPointIdx === null) return;
    setGeoPoints(prev => prev.slice(0, returnPointIdx + 1));
    setReturnPointIdx(null);
  };

  const handleSave = () => {
    const tagObjs = selectedTags
      .map(t => TAG_CATALOG.find(c => c.text === t))
      .filter((t): t is (typeof TAG_CATALOG)[number] => Boolean(t));
    onSave({
      id: createCourseId(title, normalizedPath, km),
      title: title.trim() || "이름 없는 코스",
      area: addressShort || "내 코스",
      distance: +km.toFixed(1),
      minutes: minsRounded,
      elevation: Math.round(km * 3),
      color: tagObjs[0]?.color || "mint",
      author: "나",
      saves: 0,
      anchor: normalizedPath[0] ?? { x: 0.5, y: 0.5 },
      path: normalizedPath,
      geoPath: geoPoints,
      startPoint: geoPoints[0],
      tags: tagObjs.length ? tagObjs : [{ text: "내코스", emoji: "🎒", color: "mint" }],
      mine: true,
    });
  };

  return (
    <section className="drawing">
      <div className="drawing-top">
        <button className="icon-btn" onClick={onExit} aria-label="닫기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C2A29"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div>
          <h1>{stage === "draw" ? "코스 그리기" : "코스 정보"}</h1>
          <p>
            {stage === "draw"
              ? (geoPoints.length === 0
                  ? "지도를 탭해 시작점을 찍어주세요 👇"
                  : returnPointIdx !== null
                    ? `왕복 코스 · ${returnPointIdx + 1}개 지점`
                    : `${geoPoints.length}개 지점 · 탭해서 이어가기`)
              : "코스 이름과 태그를 정해주세요"}
          </p>
        </div>
        {stage === "draw" && geoPoints.length > 0 && (
          <button className="icon-btn" onClick={() => {
            if (returnPointIdx !== null) {
              handleCancelReturn();
            } else {
              setGeoPoints(p => p.slice(0, -1));
            }
          }} aria-label="되돌리기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C2A29"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14l-4-4 4-4"/><path d="M5 10h9a5 5 0 1 1 0 10h-2"/>
            </svg>
          </button>
        )}
      </div>

      {stage === "draw" && (
        <>
          <div ref={mapContainerRef} className="draw-map">
            {!mapReady && !mapFailed && (
              <div className="map-loading"><span>지도 불러오는 중…</span></div>
            )}
            {mapFailed && (
              <div className="map-loading"><span>지도를 불러올 수 없어요</span></div>
            )}
            {mapReady && geoPoints.length === 0 && (
              <div className="draw-hint">👆 지도를 탭해 시작점 찍기</div>
            )}
          </div>

          <div className="draw-dock">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--text-1)",
                            letterSpacing: "-0.03em", lineHeight: 1 }}>
                {km.toFixed(2)}
                <span style={{ fontSize: 14, color: "var(--text-3)", marginLeft: 4, fontWeight: 700 }}>km</span>
              </div>
              <div style={{ marginTop: 4, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                <IconClock size={13}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                  {minsRounded >= 60 ? `${Math.floor(minsRounded / 60)}시간 ${minsRounded % 60}분` : `${minsRounded}분`}
                </span>
                <span className="dot-divider"/>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {returnPointIdx !== null ? `왕복` : `${geoPoints.length}개 지점`}
                </span>
              </div>
            </div>
            {geoPoints.length >= 2 && (
              <button
                onClick={returnPointIdx !== null ? handleCancelReturn : handleActivateReturn}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 999,
                  background: returnPointIdx !== null ? "var(--mint-deep)" : "transparent",
                  border: returnPointIdx !== null ? "1px solid var(--mint-deep)" : "1px solid var(--border-warm)",
                  cursor: "pointer",
                  color: returnPointIdx !== null ? "#fff" : "var(--text-2)",
                  fontWeight: 700, fontSize: 12.5, fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <span>↩</span>
                <span>{returnPointIdx !== null ? "왕복 취소" : "왕복"}</span>
              </button>
            )}
            {geoPoints.length > 0 && returnPointIdx === null && (
              <button onClick={() => setGeoPoints([])} style={{
                height: 36, padding: "0 14px", borderRadius: 999, background: "transparent",
                border: "1px solid var(--border-warm)", cursor: "pointer",
                color: "var(--text-2)", fontWeight: 700, fontSize: 12.5, fontFamily: "inherit",
              }}>초기화</button>
            )}
          </div>

          <div style={{ padding: "0 16px 14px", background: "var(--bg-card)" }}>
            <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12 }}>
              {PACE_PRESETS.map(p => (
                <button key={p.id} onClick={() => setPaceId(p.id as typeof paceId)} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  height: 34, padding: "0 14px", borderRadius: 999, cursor: "pointer",
                  background: paceId === p.id ? "var(--text-1)" : "var(--bg-soft)",
                  border: paceId === p.id ? "1px solid var(--text-1)" : "1px solid var(--border-warm)",
                  color: paceId === p.id ? "var(--bg-cream)" : "var(--text-2)",
                  fontWeight: 700, fontSize: 12.5, fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                  <span style={{ opacity: 0.6, fontSize: 11 }}>{p.pace.toFixed(1).replace(".", "'")}″</span>
                </button>
              ))}
            </div>
            <button onClick={() => canSave && setStage("details")} disabled={!canSave} style={{
              width: "100%", height: 52, borderRadius: 18,
              background: canSave ? "var(--mint-deep)" : "var(--border-warm)",
              color: canSave ? "#fff" : "var(--text-4)",
              border: "none", cursor: canSave ? "pointer" : "not-allowed",
              fontWeight: 800, fontSize: 15, fontFamily: "inherit", letterSpacing: "-0.01em",
              boxShadow: canSave ? "0 6px 16px -6px rgba(47, 139, 110, 0.5)" : "none",
            }}>
              {canSave ? "다음" : "2개 이상 점을 찍어주세요"}
            </button>
          </div>
        </>
      )}

      {stage === "details" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 100px" }}>
            <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: 16,
                          border: "1px solid var(--border-warm)", boxShadow: "var(--shadow-card)",
                          display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: 18, background: "var(--mint-soft)",
                            position: "relative", overflow: "hidden" }}>
                <svg width="96" height="96" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d={smoothD} fill="none" stroke="var(--mint-deep)" strokeWidth="4"
                        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
                  {km.toFixed(2)}<span style={{ fontSize: 14, color: "var(--text-3)", marginLeft: 4 }}>km</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "var(--text-3)" }}>
                  <IconClock size={13}/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                    {Math.floor(minsRounded / 60) > 0 ? `${Math.floor(minsRounded / 60)}시간 ` : ""}{minsRounded % 60}분
                  </span>
                  <span className="dot-divider"/>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>{pace.label} 페이스</span>
                </div>
                {returnPointIdx !== null && (
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700,
                                color: "var(--mint-deep)", display: "flex", alignItems: "center", gap: 3 }}>
                    <span>↩</span><span>왕복 코스</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                코스 이름
              </label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="예) 여의도 한강 야경 5km" maxLength={28} style={{
                  width: "100%", height: 48, padding: "0 16px", borderRadius: 16,
                  border: "1px solid var(--border-warm)", background: "var(--bg-card)",
                  fontSize: 15, fontWeight: 600, color: "var(--text-1)",
                  fontFamily: "inherit", outline: "none", boxShadow: "var(--shadow-soft)",
                }}/>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
                태그 <span style={{ color: "var(--text-4)", fontWeight: 500 }}>· 최대 4개 ({selectedTags.length}/4)</span>
              </label>
              <div className="tag-picker">
                {TAG_CATALOG.map(t => {
                  const on = selectedTags.includes(t.text);
                  return (
                    <button key={t.text} onClick={() =>
                      setSelectedTags(prev =>
                        prev.includes(t.text) ? prev.filter(x => x !== t.text)
                          : prev.length < 4 ? [...prev, t.text] : prev
                      )} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      height: 32, padding: "0 12px", borderRadius: 999, cursor: "pointer",
                      background: on ? `var(--${t.color}-soft)` : "var(--bg-card)",
                      border: on ? "1.5px solid var(--mint-deep)" : "1px solid var(--border-warm)",
                      color: "var(--text-1)", fontWeight: 700, fontSize: 12.5,
                      fontFamily: "inherit", transition: "all 0.15s ease",
                    }}>
                      <span>#{t.text}</span>
                      <span style={{ fontSize: 11 }}>{t.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 14, borderRadius: 16,
                          background: "var(--yellow-soft)", color: "var(--yellow-ink)",
                          fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>
              🍀 로그인 없이 내 브라우저에 저장돼요. 나중에 공유 링크로 친구들한테 보낼 수 있어요.
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0,
                        background: "var(--bg-card)", borderTop: "1px solid var(--border-warm)",
                        padding: "12px 16px", display: "flex", gap: 8,
                        boxShadow: "0 -8px 24px -12px rgba(120, 90, 60, 0.18)" }}>
            <button onClick={() => setStage("draw")} style={{
              height: 52, padding: "0 18px", borderRadius: 18, background: "var(--bg-soft)",
              border: "1px solid var(--border-warm)", cursor: "pointer",
              color: "var(--text-2)", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
            }}>이전</button>
            <button onClick={handleSave} style={{
              flex: 1, height: 52, borderRadius: 18, background: "var(--mint-deep)",
              color: "#fff", border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: 15, fontFamily: "inherit", letterSpacing: "-0.01em",
              boxShadow: "0 6px 16px -6px rgba(47, 139, 110, 0.5)",
            }}>저장하고 공유하기</button>
          </div>
        </>
      )}
    </section>
  );
}

function makeSvgMarkerUrl(isStart: boolean, isEnd: boolean): string {
  let svg: string;
  if (isStart) {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="11" fill="#2F8B6E" stroke="white" stroke-width="2.5"/><text x="14" y="18" text-anchor="middle" fill="white" font-weight="800" font-size="11" font-family="sans-serif">S</text></svg>`;
  } else if (isEnd) {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="8.5" fill="white" stroke="#2F8B6E" stroke-width="3"/></svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="3.5" fill="white" stroke="#2F8B6E" stroke-width="2"/></svg>`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function makeTurnaroundMarkerUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="12" fill="#FF8C42" stroke="white" stroke-width="2.5"/><path d="M10 15 Q10 10 15 10 Q20 10 20 15 L20 18 M17 16 L20 18 L20 14" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
