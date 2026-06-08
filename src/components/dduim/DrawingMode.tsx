import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Course, CourseVisibility, LatLngLiteral } from "@/lib/dduim/types";
import { PACE_PRESETS } from "@/lib/dduim/data";
import {
  calcGeoDistance,
  createCourseId,
  deriveNormalizedPath,
  generateReturnPath,
  smoothGeoPath,
  smoothedPath,
} from "@/lib/dduim/utils";
import { IconClock } from "./icons";
import {
  loadLeafletMap,
  type LeafletMap,
  type LeafletMarker,
  type LeafletNamespace,
  type LeafletPolyline,
} from "@/lib/osm/load-leaflet-map";
import {
  OSM_BASEMAP_ATTRIBUTION,
  OSM_BASEMAP_MAX_NATIVE_ZOOM,
  OSM_BASEMAP_MAX_ZOOM,
  OSM_BASEMAP_MIN_ZOOM,
  OSM_BASEMAP_TILE_URL,
} from "@/lib/osm/basemap";
import { fetchPedestrianRoute } from "@/lib/osm/pedestrian-routing";
import { reverseGeocode } from "@/lib/osm/reverse-geocode";

const DEFAULT_CENTER = { lat: 37.52693, lng: 126.93447, level: 5 };
const ROUTE_COLOR = "#6FC2A6";
const RETURN_COLOR = "#FF9B66";

type DrawingSnapshot = {
  controlPoints: LatLngLiteral[];
  returnEnabled: boolean;
  selectedPointIndex: number | null;
};

export function DrawingMode({ onExit, onSave, initialCenter }: {
  onExit: () => void;
  onSave: (course: Course) => void;
  initialCenter?: { lat: number; lng: number; level?: number };
}) {
  const [controlPoints, setControlPoints] = useState<LatLngLiteral[]>([]);
  const [addressShort, setAddressShort] = useState("");
  const [paceId, setPaceId] = useState<"walk" | "jog" | "run" | "fast">("jog");
  const [stage, setStage] = useState<"draw" | "details">("draw");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<CourseVisibility>("private");
  const [smoothness, setSmoothness] = useState(0.42);
  const [returnEnabled, setReturnEnabled] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapRevision, setMapRevision] = useState(0);
  const [routingStatus, setRoutingStatus] = useState<"idle" | "routing" | "fallback">("idle");
  const [snappedForwardPath, setSnappedForwardPath] = useState<LatLngLiteral[]>([]);
  const [snappedReturnPath, setSnappedReturnPath] = useState<LatLngLiteral[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletNamespace | null>(null);
  const polylineRef = useRef<LeafletPolyline | null>(null);
  const returnPolylineRef = useRef<LeafletPolyline | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const initialCenterRef = useRef(initialCenter);
  const controlPointsRef = useRef(controlPoints);
  const returnEnabledRef = useRef(returnEnabled);
  const selectedPointIndexRef = useRef(selectedPointIndex);
  const undoStackRef = useRef<DrawingSnapshot[]>([]);
  const dragSnapshotRef = useRef<DrawingSnapshot | null>(null);

  useEffect(() => {
    controlPointsRef.current = controlPoints;
  }, [controlPoints]);

  useEffect(() => {
    returnEnabledRef.current = returnEnabled;
  }, [returnEnabled]);

  useEffect(() => {
    selectedPointIndexRef.current = selectedPointIndex;
  }, [selectedPointIndex]);

  const returnStartIndex = returnEnabled ? controlPoints.length - 1 : null;
  const returnSegmentSeed = useMemo(() => {
    if (returnStartIndex == null) return [];
    return [controlPoints[returnStartIndex], ...generateReturnPath(controlPoints)];
  }, [controlPoints, returnStartIndex]);
  const fallbackForwardPath = useMemo(() => smoothGeoPath(controlPoints, smoothness), [controlPoints, smoothness]);
  const fallbackReturnPath = useMemo(
    () => returnSegmentSeed.length ? smoothGeoPath(returnSegmentSeed, smoothness) : [],
    [returnSegmentSeed, smoothness],
  );
  const forwardPath = useMemo(
    () => snappedForwardPath.length >= 2 ? snappedForwardPath : fallbackForwardPath,
    [fallbackForwardPath, snappedForwardPath],
  );
  const returnPath = useMemo(
    () => returnEnabled
      ? snappedReturnPath.length >= 2 ? snappedReturnPath : fallbackReturnPath
      : [],
    [fallbackReturnPath, returnEnabled, snappedReturnPath],
  );
  const routePath = useMemo(() => combineRoutePaths(forwardPath, returnPath), [forwardPath, returnPath]);
  const pace = PACE_PRESETS.find(p => p.id === paceId) || PACE_PRESETS[1];
  const km = calcGeoDistance(routePath);
  const minsRounded = Math.max(1, Math.round(km * pace.pace));
  const canSave = controlPoints.length >= 2 && km > 0.05;
  const normalizedPath = deriveNormalizedPath(routePath);
  const smoothD = smoothedPath(normalizedPath);
  const firstLat = controlPoints[0]?.lat;
  const firstLng = controlPoints[0]?.lng;

  const currentDrawingSnapshot = useCallback((): DrawingSnapshot => ({
    controlPoints: controlPointsRef.current,
    returnEnabled: returnEnabledRef.current,
    selectedPointIndex: selectedPointIndexRef.current,
  }), []);

  const pushUndoSnapshot = useCallback((snapshot = currentDrawingSnapshot()) => {
    undoStackRef.current = [...undoStackRef.current.slice(-19), snapshot];
    setUndoCount(undoStackRef.current.length);
  }, [currentDrawingSnapshot]);

  const undoLastAction = useCallback(() => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;
    controlPointsRef.current = snapshot.controlPoints;
    returnEnabledRef.current = snapshot.returnEnabled;
    selectedPointIndexRef.current = snapshot.selectedPointIndex;
    setControlPoints(snapshot.controlPoints);
    setReturnEnabled(snapshot.returnEnabled);
    setSelectedPointIndex(snapshot.selectedPointIndex);
    setUndoCount(undoStackRef.current.length);
  }, []);

  useEffect(() => {
    if (firstLat === undefined || firstLng === undefined) return;
    let cancelled = false;
    reverseGeocode(firstLat, firstLng).then(addr => {
      if (!cancelled) setAddressShort(addr);
    });
    return () => { cancelled = true; };
  }, [firstLat, firstLng]);

  useEffect(() => {
    if (controlPoints.length < 2) {
      const timeout = window.setTimeout(() => {
        setSnappedForwardPath([]);
        setRoutingStatus("idle");
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setRoutingStatus("routing");
      fetchPedestrianRoute(controlPoints, controller.signal)
        .then((route) => {
          if (controller.signal.aborted) return;
          setSnappedForwardPath(route?.path?.length ? route.path : []);
          setRoutingStatus(route?.path?.length ? "idle" : "fallback");
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSnappedForwardPath([]);
            setRoutingStatus("fallback");
          }
        });
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [controlPoints]);

  useEffect(() => {
    if (!returnEnabled || returnSegmentSeed.length < 2) {
      const timeout = window.setTimeout(() => setSnappedReturnPath([]), 0);
      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setRoutingStatus("routing");
      fetchPedestrianRoute(returnSegmentSeed, controller.signal)
        .then((route) => {
          if (controller.signal.aborted) return;
          setSnappedReturnPath(route?.path?.length ? route.path : []);
          setRoutingStatus(route?.path?.length ? "idle" : "fallback");
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSnappedReturnPath([]);
            setRoutingStatus("fallback");
          }
        });
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [returnEnabled, returnSegmentSeed]);

  useEffect(() => {
    if (stage !== "draw") return;
    let cancelled = false;

    loadLeafletMap()
      .then(L => {
        if (cancelled || !mapContainerRef.current) return;
        const center = initialCenterRef.current ?? DEFAULT_CENTER;
        const map = L.map(mapContainerRef.current, {
          center: [center.lat, center.lng],
          minZoom: OSM_BASEMAP_MIN_ZOOM,
          zoom: toLeafletZoom(center.level ?? DEFAULT_CENTER.level),
          zoomControl: false,
        });

        L.tileLayer(OSM_BASEMAP_TILE_URL, {
          attribution: OSM_BASEMAP_ATTRIBUTION,
          maxNativeZoom: OSM_BASEMAP_MAX_NATIVE_ZOOM,
          maxZoom: OSM_BASEMAP_MAX_ZOOM,
          minZoom: OSM_BASEMAP_MIN_ZOOM,
        }).addTo(map);

        leafletRef.current = L;
        mapRef.current = map;
        map.on("click", (mouseEvent) => {
          if (cancelled) return;
          const latLng = mouseEvent.latlng;
          pushUndoSnapshot();
          setSelectedPointIndex(null);
          setControlPoints(prev => [...prev, { lat: latLng.lat, lng: latLng.lng }]);
          if (returnEnabledRef.current) setReturnEnabled(false);
        });
        setMapReady(true);
        setMapRevision(revision => revision + 1);
      })
      .catch(() => {
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
      polylineRef.current?.remove();
      returnPolylineRef.current?.remove();
      markersRef.current.forEach(marker => marker.remove());
      polylineRef.current = null;
      returnPolylineRef.current = null;
      markersRef.current = [];
      leafletRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [pushUndoSnapshot, stage]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;

    polylineRef.current?.remove();
    returnPolylineRef.current?.remove();
    polylineRef.current = null;
    returnPolylineRef.current = null;

    if (forwardPath.length >= 2) {
      polylineRef.current = L.polyline(forwardPath.map(toTuple), {
        color: ROUTE_COLOR,
        opacity: 0.92,
        weight: 7,
      }).addTo(mapRef.current);
    }

    if (returnPath.length >= 2) {
      returnPolylineRef.current = L.polyline(returnPath.map(toTuple), {
        color: RETURN_COLOR,
        dashArray: "6 8",
        opacity: 0.74,
        weight: 6,
      }).addTo(mapRef.current);
    }

    return () => {
      polylineRef.current?.remove();
      returnPolylineRef.current?.remove();
      polylineRef.current = null;
      returnPolylineRef.current = null;
    };
  }, [forwardPath, mapReady, mapRevision, returnPath]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    let alive = true;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!showPoints) return;

    markersRef.current = controlPoints.map((point, index) => {
      const isStart = index === 0;
      const isEnd = index === controlPoints.length - 1 && controlPoints.length > 1;
      const size = isStart ? 30 : isEnd ? 24 : 16;
      const marker = L.marker(toTuple(point), {
        draggable: true,
        icon: L.icon({
          iconUrl: makeSvgMarkerUrl(isStart, isEnd, selectedPointIndex === index),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
        zIndexOffset: selectedPointIndex === index ? 450 : isStart ? 350 : isEnd ? 320 : 250,
      }).addTo(mapRef.current!);

      marker.on("click", () => {
        setSelectedPointIndex(prev => prev === index ? null : index);
      });
      marker.on("dragstart", () => {
        dragSnapshotRef.current = currentDrawingSnapshot();
        setSelectedPointIndex(index);
      });
      marker.on("dragend", () => {
        if (!alive) return;
        const pos = marker.getLatLng();
        if (dragSnapshotRef.current) {
          pushUndoSnapshot(dragSnapshotRef.current);
          dragSnapshotRef.current = null;
        }
        setControlPoints(prev => {
          const next = [...prev];
          next[index] = { lat: pos.lat, lng: pos.lng };
          return next;
        });
      });

      return marker;
    });

    return () => {
      alive = false;
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [controlPoints, currentDrawingSnapshot, mapReady, mapRevision, pushUndoSnapshot, selectedPointIndex, showPoints]);

  const clearPoints = () => {
    if (controlPoints.length === 0 && !returnEnabled) return;
    pushUndoSnapshot();
    setSelectedPointIndex(null);
    setReturnEnabled(false);
    setControlPoints([]);
  };

  const deleteSelectedPoint = () => {
    if (selectedPointIndex == null) return;
    pushUndoSnapshot();
    setControlPoints(prev => prev.filter((_, index) => index !== selectedPointIndex));
    setSelectedPointIndex(null);
    setReturnEnabled(false);
  };

  const toggleReturn = () => {
    if (controlPoints.length < 2) return;
    pushUndoSnapshot();
    setSelectedPointIndex(null);
    setReturnEnabled(prev => !prev);
  };

  const returnFromSelectedPoint = () => {
    if (selectedPointIndex == null || selectedPointIndex < 1) return;
    pushUndoSnapshot();
    setControlPoints(prev => prev.slice(0, selectedPointIndex + 1));
    setReturnEnabled(true);
    setSelectedPointIndex(null);
  };

  const handleSave = () => {
    onSave({
      id: createCourseId(title, normalizedPath, km),
      title: title.trim() || "이름 없는 코스",
      area: addressShort || "내 코스",
      distance: +km.toFixed(1),
      minutes: minsRounded,
      elevation: Math.round(km * 3),
      color: "mint",
      author: "나",
      saves: 0,
      anchor: normalizedPath[0] ?? { x: 0.5, y: 0.5 },
      path: normalizedPath,
      geoPath: routePath,
      startPoint: routePath[0],
      tags: [],
      mine: true,
      visibility,
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
          <p>{stage === "draw" ? drawHint(controlPoints.length, returnEnabled) : "이름만 정하면 내 코스로 저장돼요"}</p>
        </div>
      </div>

      {stage === "draw" && (
        <>
          <div ref={mapContainerRef} className="draw-map">
            {!mapReady && !mapFailed && (
              <div className="map-loading"><span>지도 불러오는 중</span></div>
            )}
            {mapFailed && (
              <div className="map-loading"><span>지도를 불러오지 못했어요</span></div>
            )}
            {mapReady && controlPoints.length === 0 && (
              <div className="draw-hint">지도에서 출발점을 톡 찍어주세요</div>
            )}
            {mapReady && controlPoints.length >= 2 && routingStatus !== "idle" && (
              <div className="route-snap-status">
                {routingStatus === "routing" ? "보행로에 붙이는 중" : "보행 경로를 찾지 못해 임시 선으로 표시 중"}
              </div>
            )}
          </div>

          {/* 점 선택 컨텍스트 바 */}
          {selectedPointIndex != null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 14px", flexShrink: 0,
              background: "var(--bg-card)",
              borderTop: "3px solid var(--mint-deep)",
              boxShadow: "0 -2px 12px -4px rgba(47, 139, 110, 0.18)",
            }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 22, height: 22, borderRadius: 8,
                  background: selectedPointIndex === 0 ? "var(--mint-deep)"
                    : selectedPointIndex === controlPoints.length - 1 && controlPoints.length > 1
                    ? "var(--text-2)" : "var(--border-warm)",
                  fontSize: 9, fontWeight: 900, color: "#fff", flexShrink: 0,
                }}>
                  {selectedPointIndex === 0 ? "S"
                    : selectedPointIndex === controlPoints.length - 1 && controlPoints.length > 1
                    ? "E" : selectedPointIndex}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>
                  {selectedPointIndex === 0
                    ? "출발점"
                    : selectedPointIndex === controlPoints.length - 1 && controlPoints.length > 1
                    ? "도착점"
                    : `${selectedPointIndex + 1}번 점`}
                </span>
              </div>
              <button
                onClick={returnFromSelectedPoint}
                disabled={selectedPointIndex < 1}
                style={pointActionStyle(selectedPointIndex < 1 ? "muted" : "mint")}
              >
                <span style={{ marginRight: 4, fontSize: 13 }}>↩</span>
                왕복
              </button>
              <button onClick={deleteSelectedPoint} style={pointActionStyle("danger")}>삭제</button>
              <button
                onClick={() => setSelectedPointIndex(null)}
                style={{
                  width: 28, height: 28, borderRadius: 999, border: "1px solid var(--border-warm)",
                  background: "var(--bg-soft)", color: "var(--text-3)",
                  cursor: "pointer", fontSize: 15, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, lineHeight: 1,
                }}
              >×</button>
            </div>
          )}

          {/* 조정 확장 패널 */}
          {showAdjust && (
            <div style={{
              padding: "12px 16px 6px", flexShrink: 0,
              background: "var(--bg-card)", borderTop: "1px solid var(--border-warm)",
            }}>
              <label style={{ display: "grid", gridTemplateColumns: "68px 1fr 38px", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-2)" }}>부드러움</span>
                <input
                  type="range"
                  value={smoothness}
                  min={0}
                  max={0.85}
                  step={0.01}
                  onChange={event => setSmoothness(Number(event.target.value))}
                />
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-3)", textAlign: "right" }}>
                  {Math.round(smoothness * 100)}
                </span>
              </label>
              <div style={{ display: "flex", gap: 0, marginTop: 12, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-warm)" }}>
                {PACE_PRESETS.map((p, i) => {
                  const active = paceId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPaceId(p.id)}
                      style={{
                        flex: 1, height: 36, border: "none",
                        borderLeft: i > 0 ? "1px solid var(--border-warm)" : "none",
                        background: active ? "var(--mint-deep)" : "var(--bg-soft)",
                        color: active ? "#fff" : "var(--text-2)",
                        fontSize: 12, fontWeight: 800, fontFamily: "inherit",
                        cursor: "pointer", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 1,
                        transition: "background 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 13, lineHeight: 1 }}>{p.emoji}</span>
                      <span style={{ fontSize: 10, lineHeight: 1, marginTop: 2 }}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8, paddingBottom: 4 }}>
                <AdjustButton label={showPoints ? "점 숨기기" : "점 보이기"} onClick={() => setShowPoints(prev => !prev)}/>
                <AdjustButton label="전체 초기화" onClick={clearPoints} disabled={controlPoints.length === 0}/>
              </div>
            </div>
          )}

          {/* 하단 독 */}
          <div style={{
            padding: "10px 14px 22px", flexShrink: 0,
            background: "var(--bg-card)", borderTop: "1px solid var(--border-warm)",
            boxShadow: "0 -6px 20px -10px rgba(120, 90, 60, 0.15)",
          }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
              {undoCount > 0 && (
                <button onClick={undoLastAction} style={dockChipStyle(false)}>↶ 되돌리기</button>
              )}
              <button
                disabled={controlPoints.length < 2}
                onClick={toggleReturn}
                style={dockChipStyle(returnEnabled, controlPoints.length < 2)}
              >
                {returnEnabled ? "↩ 왕복 켜짐" : "↩ 왕복"}
              </button>
              <button onClick={() => setShowAdjust(prev => !prev)} style={dockChipStyle(showAdjust)}>
                ⚙ 조정
              </button>
              {km > 0 && (
                <div style={{
                  marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 3,
                  background: "var(--mint-soft)", borderRadius: 12, padding: "5px 10px",
                }}>
                  <strong style={{ fontSize: 15, fontWeight: 950, color: "var(--mint-deep)", letterSpacing: "-0.02em" }}>
                    {km.toFixed(2)}
                  </strong>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--mint-deep)", opacity: 0.7 }}>km</span>
                </div>
              )}
            </div>
            <button onClick={() => canSave && setStage("details")} disabled={!canSave} style={{
              width: "100%", height: 52, borderRadius: 18,
              background: canSave ? "var(--mint-deep)" : "var(--border-warm)",
              color: canSave ? "#fff" : "var(--text-4)",
              border: "none", cursor: canSave ? "pointer" : "not-allowed",
              fontWeight: 800, fontSize: 15, fontFamily: "inherit",
              boxShadow: canSave ? "0 6px 16px -6px rgba(47, 139, 110, 0.5)" : "none",
              transition: "all 0.2s ease",
            }}>
              {canSave ? "다음 →" : "점 2개 이상 찍어주세요"}
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
                {returnEnabled && (
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
                placeholder="예: 한강 저녁 조깅 5km" maxLength={28} style={{
                  width: "100%", height: 48, padding: "0 16px", borderRadius: 16,
                  border: "1px solid var(--border-warm)", background: "var(--bg-card)",
                  fontSize: 15, fontWeight: 600, color: "var(--text-1)",
                  fontFamily: "inherit", outline: "none", boxShadow: "var(--shadow-soft)",
                }}/>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
                저장 방식
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["private"] as CourseVisibility[]).map(v => {
                  const isActive = visibility === v;
                  const label = "나만 보기";
                  return (
                    <button key={v} onClick={() => setVisibility(v)} style={{
                      flex: 1, height: 44, borderRadius: 14, cursor: "pointer",
                      background: isActive ? "var(--mint-deep)" : "var(--bg-card)",
                      border: isActive ? "1.5px solid var(--mint-deep)" : "1px solid var(--border-warm)",
                      color: isActive ? "#fff" : "var(--text-2)",
                      fontWeight: 700, fontSize: 13.5, fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}>
                      {label}
                    </button>
                  );
                })}
              </div>
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
            }}>나만의 코스로 저장</button>
          </div>
        </>
      )}
    </section>
  );
}

function drawHint(pointCount: number, returnEnabled: boolean) {
  if (pointCount === 0) return "지도에서 출발점을 톡 찍어주세요";
  if (returnEnabled) return "왕복 코스가 만들어졌어요";
  return "길을 따라 톡톡 찍고, 필요하면 점을 끌어 옮기세요";
}

function dockChipStyle(active: boolean, disabled = false): React.CSSProperties {
  return {
    height: 34, padding: "0 12px", borderRadius: 20,
    border: active ? "1.5px solid var(--mint-deep)" : "1px solid var(--border-warm)",
    background: active ? "var(--mint)" : "var(--bg-soft)",
    color: disabled ? "var(--text-4)" : active ? "var(--mint-deep)" : "var(--text-1)",
    opacity: disabled ? 0.45 : 1,
    fontSize: 12, fontWeight: 800, fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    flexShrink: 0,
  };
}

function pointActionStyle(variant: "mint" | "danger" | "muted"): React.CSSProperties {
  const configs = {
    mint: { background: "var(--mint-deep)", color: "#fff", border: "none" },
    danger: { background: "#FFE3E6", color: "#C04C5A", border: "1px solid #F5C0C7" },
    muted: { background: "var(--bg-soft)", color: "var(--text-4)", border: "1px solid var(--border-warm)" },
  };
  return {
    height: 32, padding: "0 12px", borderRadius: 12,
    cursor: variant === "muted" ? "not-allowed" : "pointer",
    fontSize: 12, fontWeight: 800, fontFamily: "inherit",
    display: "flex", alignItems: "center",
    ...configs[variant],
  };
}

function AdjustButton({ label, disabled = false, onClick }: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 38, borderRadius: 13, border: "1px solid var(--border-warm)",
        background: "var(--bg-soft)", color: disabled ? "var(--text-4)" : "var(--text-1)",
        opacity: disabled ? 0.55 : 1, fontSize: 12, fontWeight: 800,
        fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

function combineRoutePaths(forwardPath: LatLngLiteral[], returnPath: LatLngLiteral[]): LatLngLiteral[] {
  if (!returnPath.length) return forwardPath;
  if (!forwardPath.length) return returnPath;
  return [...forwardPath, ...returnPath.slice(1)];
}

function toTuple(point: LatLngLiteral): [number, number] {
  return [point.lat, point.lng];
}

function toLeafletZoom(level: number) {
  const zoom = level > 10 ? level : 16 - level;
  return Math.max(OSM_BASEMAP_MIN_ZOOM, Math.min(OSM_BASEMAP_MAX_ZOOM, zoom));
}

function makeSvgMarkerUrl(isStart: boolean, isEnd: boolean, isSelected: boolean): string {
  const size = isStart ? 30 : isEnd ? 24 : 16;
  const radius = isStart ? 12 : isEnd ? 9 : 6;
  const fill = isStart ? "#2F8B6E" : isEnd ? "#FFFFFF" : "#FFFFFF";
  const stroke = isSelected ? "#FF8C42" : "#2F8B6E";
  const strokeWidth = isSelected ? 4 : isEnd ? 3 : 2.5;
  const label = isStart ? `<text x="${size / 2}" y="${size / 2 + 4}" text-anchor="middle" fill="white" font-weight="800" font-size="11" font-family="sans-serif">S</text>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>${label}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
