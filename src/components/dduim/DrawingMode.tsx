import { useEffect, useRef, useState } from "react";
import type { Course } from "@/lib/dduim/types";
import { PACE_PRESETS, TAG_CATALOG } from "@/lib/dduim/data";
import { calcDistance, createCourseId, smoothedPath } from "@/lib/dduim/utils";
import { IconClock } from "./icons";
import { MapView } from "./MapView";

export function DrawingMode({ onExit, onSave }: {
  onExit: () => void; onSave: (course: Course) => void;
}) {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [paceId, setPaceId] = useState<"walk" | "jog" | "run" | "fast">("jog");
  const [stage, setStage] = useState<"draw" | "details">("draw");
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aspect, setAspect] = useState(1.0);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      const el = canvasRef.current;
      if (el) setAspect(el.clientHeight / Math.max(1, el.clientWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const pace = PACE_PRESETS.find(p => p.id === paceId) || PACE_PRESETS[1];
  const km = calcDistance(points, aspect);
  const minsRounded = Math.max(1, Math.round(km * pace.pace));
  const canSave = points.length >= 2 && km > 0.05;

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setPoints(prev => [...prev, { x, y }]);
  };

  const smoothD = smoothedPath(points);

  const handleSave = () => {
    const tagObjs = selectedTags
      .map(t => TAG_CATALOG.find(c => c.text === t))
      .filter((t): t is (typeof TAG_CATALOG)[number] => Boolean(t));
    onSave({
      id: createCourseId(title, points, km),
      title: title.trim() || "이름 없는 코스",
      area: "내 코스",
      distance: +km.toFixed(1),
      minutes: minsRounded,
      elevation: Math.round(km * 3),
      color: tagObjs[0]?.color || "mint",
      author: "나",
      saves: 0,
      anchor: points[0],
      path: points,
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
              ? (points.length === 0 ? "지도를 탭해 시작점을 찍어주세요 👇" : `${points.length}개 지점 · 탭해서 이어가기`)
              : "코스 이름과 태그를 정해주세요"}
          </p>
        </div>
        {stage === "draw" && points.length > 0 && (
          <button className="icon-btn" onClick={() => setPoints(p => p.slice(0, -1))} aria-label="되돌리기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C2A29"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14l-4-4 4-4"/><path d="M5 10h9a5 5 0 1 1 0 10h-2"/>
            </svg>
          </button>
        )}
      </div>

      {stage === "draw" && (
        <>
          <div ref={canvasRef} className="draw-map" onClick={onCanvasClick}>
            <MapView courses={[]} activeId=""/>
            {points.length >= 1 && (
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100"
                   style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <path d={smoothD} fill="none" stroke="#fff" strokeWidth="2.4"
                      strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}/>
                <path d={smoothD} fill="none" stroke="var(--mint-deep)" strokeWidth="1.4"
                      strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                      style={{ strokeWidth: "5px" }}/>
              </svg>
            )}
            {points.map((p, i) => {
              const isStart = i === 0;
              const isEnd = i === points.length - 1 && points.length > 1;
              return (
                <div key={i} style={{ position: "absolute", left: `${p.x * 100}%`, top: `${p.y * 100}%`,
                                      transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
                  {isStart ? (
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--mint-deep)",
                                  border: "3px solid #fff", display: "flex", alignItems: "center",
                                  justifyContent: "center", boxShadow: "var(--shadow-pin)",
                                  color: "#fff", fontWeight: 800, fontSize: 11 }}>S</div>
                  ) : isEnd ? (
                    <div style={{ width: 22, height: 22, borderRadius: 999, background: "#fff",
                                  border: "3px solid var(--mint-deep)", boxShadow: "var(--shadow-pin)" }}/>
                  ) : (
                    <div style={{ width: 10, height: 10, borderRadius: 999, background: "#fff",
                                  border: "2px solid var(--mint-deep)",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.18)" }}/>
                  )}
                </div>
              );
            })}
            {points.length === 0 && (
              <div className="draw-hint">👆 탭해서 시작점 찍기</div>
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
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>{points.length}개 지점</span>
              </div>
            </div>
            {points.length > 0 && (
              <button onClick={() => setPoints([])} style={{
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

// ─── Utilities ────────────────────────────────────────────────────────────────
