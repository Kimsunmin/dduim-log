"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Course, SnapPosition } from "@/lib/dduim/types";
import { AREAS, FILTER_OPTIONS, navItems } from "@/lib/dduim/data";
import type { TabId } from "@/lib/dduim/data";
import { useDduimStore } from "@/lib/dduim/store";
import { BottomSheet } from "@/components/dduim/BottomSheet";
import { CourseCard } from "@/components/dduim/CourseCard";
import { DrawingMode } from "@/components/dduim/DrawingMode";
import { IconBookmark, IconChevronDown, IconCompass, IconMap, IconPlus, IconSearch, IconUser, ShoeGlyph, SmileFavorite } from "@/components/dduim/icons";
import { KakaoMapView } from "@/components/dduim/KakaoMapView";
import { MiniMap } from "@/components/dduim/MiniMap";
import { MyCourseLines } from "@/components/dduim/MyCourseLines";

export default function Home() {
  const [tab, setTab] = useState<TabId>("home");
  const [activeId, setActiveId] = useState(() =>
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("c") ?? "")
      : ""
  );
  const [filter, setFilter] = useState("전체");
  const [snap, setSnap] = useState<SnapPosition>("mid");
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; level: number }>({ lat: 37.52693, lng: 126.93447, level: 7 });
  const [toast, setToast] = useState("");
  const [limitModal, setLimitModal] = useState(false);
  const { userCourses, savedCourseIds, currentUser, actions } = useDduimStore();

  const courses = useMemo(() => [...userCourses], [userCourses]);
  const favoriteSet = useMemo(() => new Set(savedCourseIds), [savedCourseIds]);
  const visibleCourses = useMemo(() => {
    if (filter === "전체") return courses;
    return courses.filter(c => c.tags.some(t => t.text === filter));
  }, [courses, filter]);
  const orderedCourses = useMemo(() =>
    [...visibleCourses].sort((a, b) => a.id === activeId ? -1 : b.id === activeId ? 1 : 0),
    [activeId, visibleCourses]);
  const activeCourse = courses.find(c => c.id === activeId);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1600);
  };

  const toggleFavorite = (id: string) => {
    const isSaved = actions.toggleSavedCourse(id);
    showToast(isSaved ? "즐겨찾기에 저장했어요" : "즐겨찾기에서 뺐어요");
  };

  const saveMine = async (course: Course) => {
    const result = await actions.saveUserCourse(course);
    if (result.limitReached) { setLimitModal(true); return; }
    setActiveId(course.id);
    setTab("home");
    setDrawingOpen(false);
    showToast(course.visibility === "public" ? "코스가 저장됐어요 🌍" : "나만의 코스로 저장됐어요 🔒");
  };

  const pickCourse = (id: string) => { setActiveId(id); setTab("home"); setSnap("peek"); };

  const shareCourse = (id: string) => {
    const url = `${window.location.origin}/?c=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url).then(() => showToast("링크를 복사했어요 📋"));
  };

  return (
    <main className="stage">
      <section className="app-viewport" aria-label="뜀로그 앱">
        {tab === "home" && (
          <ExploreView
            activeCourse={activeCourse} activeId={activeId} courses={courses}
            favoriteSet={favoriteSet} filter={filter} orderedCourses={orderedCourses}
            setActiveId={id => { setActiveId(id); setSnap("peek"); }}
            setFilter={setFilter} toggleFavorite={toggleFavorite}
            visibleCourses={visibleCourses} snap={snap} setSnap={setSnap}
            onCenterChange={setMapCenter}
            onShare={shareCourse}
          />
        )}
        {tab === "feed" && (
          <FeedView/>
        )}
        {tab === "saves" && (
          <SavesView courses={courses} favoriteSet={favoriteSet}
            toggleFavorite={toggleFavorite} pickCourse={pickCourse}/>
        )}
        {tab === "me" && (
          <MeView
            currentUser={currentUser}
            favoriteCount={savedCourseIds.length}
            mineCount={userCourses.length}
            totalKm={userCourses.reduce((s, c) => s + c.distance, 0)}
            onRenameUser={actions.updateDisplayName}
          />
        )}

        {(tab === "home" || tab === "saves") && (
          <button className="fab" aria-label="새 코스 그리기" onClick={() => setDrawingOpen(true)}>
            <IconPlus size={24} color="#FDFCF8"/>
          </button>
        )}

        <nav className="bottom-nav" aria-label="주요 메뉴">
          {navItems.map(item => (
            <button key={item.id} className={`nav-btn ${tab === item.id ? "is-active" : ""}`}
              onClick={() => setTab(item.id)} style={{ position: "relative" }}>
              {item.id === "home"  && <IconMap size={20}/>}
              {item.id === "feed"  && <IconCompass size={20}/>}
              {item.id === "saves" && (
                <>
                  <IconBookmark size={20}/>
                  {(savedCourseIds.length + userCourses.length) > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 6, minWidth: 16,
                                   height: 16, padding: "0 4px", borderRadius: 999,
                                   background: "var(--pink-deep)", color: "#fff",
                                   fontSize: 9, fontWeight: 800, display: "flex",
                                   alignItems: "center", justifyContent: "center" }}>
                      {savedCourseIds.length + userCourses.length}
                    </span>
                  )}
                </>
              )}
              {item.id === "me"    && <IconUser size={20}/>}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {drawingOpen && (
          <DrawingMode onExit={() => setDrawingOpen(false)} onSave={saveMine} initialCenter={mapCenter}/>
        )}
        <div className={`toast ${toast ? "is-show" : ""}`}>{toast}</div>
      </section>

      {/* 코스 10개 제한 모달 */}
      {limitModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999,
                      background: "rgba(40,28,16,0.45)", backdropFilter: "blur(4px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 24px" }}
             onClick={() => setLimitModal(false)}>
          <div style={{ background: "var(--bg-card)", borderRadius: 28,
                        padding: "28px 24px 22px", maxWidth: 340, width: "100%",
                        boxShadow: "0 8px 32px rgba(80,50,20,0.18)",
                        textAlign: "center" }}
               onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏃</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)",
                          letterSpacing: "-0.025em", marginBottom: 8 }}>
              코스를 더 만들 수 없어요
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6,
                        margin: "0 0 20px" }}>
              초기 버전에서는 코스를<br/>
              최대 <strong>10개</strong>까지만 만들 수 있어요.<br/>
              곧 더 늘릴게요 🙏
            </p>
            <button onClick={() => setLimitModal(false)} style={{
              width: "100%", height: 48, borderRadius: 16,
              background: "var(--mint)", border: "none",
              fontWeight: 800, fontSize: 15, color: "var(--text-1)",
              fontFamily: "inherit", cursor: "pointer",
            }}>확인</button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── ExploreView ──────────────────────────────────────────────────────────────
function ExploreView({ activeCourse, activeId, courses, favoriteSet, filter,
  orderedCourses, setActiveId, setFilter, toggleFavorite, visibleCourses, snap, setSnap, onCenterChange, onShare }: {
  activeCourse?: Course; activeId: string; courses: Course[];
  favoriteSet: Set<string>; filter: string; orderedCourses: Course[];
  setActiveId: (id: string) => void; setFilter: (f: string) => void;
  toggleFavorite: (id: string) => void; visibleCourses: Course[];
  snap: SnapPosition; setSnap: (s: SnapPosition) => void;
  onCenterChange?: (center: { lat: number; lng: number; level: number }) => void;
  onShare?: (id: string) => void;
}) {
  const [areaId, setAreaId] = useState("all");
  const [areaOpen, setAreaOpen] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number; level: number } | undefined>(undefined);
  const areaRef = useRef<HTMLDivElement>(null);

  const areaLabel = (() => {
    if (areaId === "all") return "전체 지역";
    for (const r of AREAS) {
      if (r.id === areaId) return r.name;
      const sub = r.subs.find(s => s.id === areaId);
      if (sub) return `${r.name} · ${sub.name}`;
    }
    return "전체 지역";
  })();

  const currentDot = (() => {
    for (const r of AREAS) {
      if (r.id === areaId || r.subs.some(s => s.id === areaId)) return r.dot;
    }
    return "#B6E4D2";
  })();

  // 선택된 지역 이름 (구 단위 매칭용)
  const areaFilterName = (() => {
    if (areaId === "all") return null;
    for (const r of AREAS) {
      if (r.id === areaId) return r.name;
      const sub = r.subs.find(s => s.id === areaId);
      if (sub) return sub.name; // "마포구" 등
    }
    return null;
  })();

  const areaFilteredVisible = areaFilterName
    ? visibleCourses.filter(c => c.area.includes(areaFilterName))
    : visibleCourses;
  const areaFilteredOrdered = areaFilterName
    ? orderedCourses.filter(c => c.area.includes(areaFilterName))
    : orderedCourses;

  useEffect(() => {
    if (!areaOpen) return;
    const close = (e: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setAreaOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAreaOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [areaOpen]);

  return (
    <>
      <div style={{ padding: "6px 18px 10px", flexShrink: 0, position: "relative", zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div ref={areaRef} style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setAreaOpen(o => !o)} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: areaOpen ? "var(--bg-soft)" : "transparent",
              border: "none", padding: "4px 8px 4px 6px", borderRadius: 999,
              cursor: "pointer", color: "var(--text-1)", fontFamily: "inherit",
              transition: "background 0.15s ease",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 999,
                             background: currentDot, display: "inline-block" }}/>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em",
                             maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis",
                             whiteSpace: "nowrap" }}>
                {areaLabel}
              </span>
              <IconChevronDown size={14} style={{ transition: "transform 0.2s ease",
                transform: areaOpen ? "rotate(180deg)" : "rotate(0)" } as React.CSSProperties}/>
            </button>

            {areaOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 260,
                            background: "var(--bg-card)", borderRadius: 22,
                            border: "1px solid var(--border-warm)",
                            boxShadow: "0 16px 40px -12px rgba(60,40,20,0.25), 0 4px 8px rgba(60,40,20,0.08)",
                            zIndex: 50, overflow: "hidden",
                            animation: "dropdown-in 0.18s cubic-bezier(0.32, 0.72, 0.24, 1)",
                            transformOrigin: "top left" }}>
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {/* 전체 */}
                  <button onClick={() => { setAreaId("all"); setPanTarget(undefined); setAreaOpen(false); }} style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "11px 16px",
                    background: areaId === "all" ? "var(--bg-soft)" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    transition: "background 0.12s ease",
                  }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>전체 지역</span>
                    {areaId === "all" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="var(--mint-deep)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </button>

                  <div style={{ height: 1, background: "var(--border-warm)", margin: "0 16px" }}/>

                  {/* 시/도 → 구/군 계층 */}
                  {AREAS.map(region => (
                    <div key={region.id}>
                      <button
                        onClick={() => setExpandedRegion(prev => prev === region.id ? null : region.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "11px 16px",
                          background: "transparent",
                          border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                          transition: "background 0.12s ease",
                        }}>
                        <span style={{ width: 10, height: 10, borderRadius: 999,
                                       background: region.dot, flexShrink: 0 }}/>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>
                          {region.name}
                        </span>
                        <IconChevronDown size={12} style={{ transition: "transform 0.2s ease",
                          transform: expandedRegion === region.id ? "rotate(180deg)" : "rotate(0)" } as React.CSSProperties}/>
                      </button>

                      {expandedRegion === region.id && region.subs.map(sub => (
                        <button key={sub.id}
                          onClick={() => { setAreaId(sub.id); setPanTarget({ lat: sub.lat, lng: sub.lng, level: sub.level }); setAreaOpen(false); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, width: "100%",
                            padding: "9px 16px 9px 36px",
                            background: areaId === sub.id ? "var(--bg-soft)" : "transparent",
                            border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                            transition: "background 0.12s ease",
                          }}>
                          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--text-2)" }}>
                            {sub.name}
                          </span>
                          {areaId === sub.id && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                 stroke="var(--mint-deep)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="search-pill" style={{ height: 38, padding: "0 14px", marginTop: 0 }}>
              <IconSearch size={16} color="#8B7F76"/>
              <input placeholder="코스 · 태그 검색"/>
            </div>
          </div>
        </div>

        <div className="chips no-scrollbar" style={{ marginTop: 10 }}>
          {FILTER_OPTIONS.map(f => (
            <button key={f} className={`chip ${filter === f ? "is-active" : ""}`}
              onClick={() => setFilter(f)}>{f === "전체" ? f : `#${f}`}</button>
          ))}
        </div>
      </div>

      <section className="map-shell">
        <KakaoMapView courses={areaFilteredVisible} activeId={activeId}
          favoriteIds={favoriteSet}
          panToLatLng={panTarget}
          onCenterChange={onCenterChange}
          onPick={id => { setActiveId(id); setSnap("peek"); }}/>
        <MyCourseLines courses={courses.filter(c => c.mine && !c.geoPath?.length)} activeId={activeId}/>
        
        <div style={{ position: "absolute", right: 12, top: 12, zIndex: 6 }}>
          <button className="icon-btn" aria-label="현재 위치" style={{ width: 36, height: 36 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C2A29"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="11" r="3"/><path d="M12 2v2M12 18v4M2 11h2M20 11h2"/>
            </svg>
          </button>
        </div>

        {activeId && activeCourse && (
          <div className="active-route-pill">
            <div className="shoe-mark"><ShoeGlyph size={12}/></div>
            <strong>{activeCourse.title}</strong>
            <button onClick={() => setActiveId("")} aria-label="선택 해제">×</button>
          </div>
        )}

        <BottomSheet snap={snap} onSnapChange={setSnap}>
          <div data-drag-handle="" style={{ padding: "0 18px 10px", cursor: "grab" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <h2 style={{ margin: 0, color: "var(--text-1)", fontSize: 16,
                           fontWeight: 800, letterSpacing: "-0.02em" }}>
                {areaLabel} 코스
              </h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)" }}>
                {areaFilteredVisible.length}
              </span>
            </div>
          </div>
          <div className="sheet-content">
            {areaFilteredOrdered.map(c => (
              <CourseCard key={c.id} course={c} isActive={c.id === activeId}
                isSaved={favoriteSet.has(c.id)}
                onClick={() => { setActiveId(c.id); setSnap("peek"); }}
                onToggleSave={toggleFavorite}
                onShare={onShare ? () => onShare(c.id) : undefined}/>
            ))}
            {areaFilteredOrdered.length === 0 && (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-3)" }}>
                조건에 맞는 코스가 아직 없어요 🐣
              </div>
            )}
          </div>
        </BottomSheet>
      </section>
    </>
  );
}

// ─── FeedView ─────────────────────────────────────────────────────────────────
function FeedView() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 12, paddingBottom: 80 }}>
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="1.4"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.025em" }}>
        피드
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-3)", fontWeight: 500 }}>준비 중이에요</div>
    </div>
  );
}

// ─── SavesView ────────────────────────────────────────────────────────────────
function SavesView({ courses, favoriteSet, toggleFavorite, pickCourse }: {
  courses: Course[]; favoriteSet: Set<string>;
  toggleFavorite: (id: string) => void; pickCourse: (id: string) => void;
}) {
  const [seg, setSeg] = useState<"favs" | "mine">("favs");
  const sort = "최근";

  const myCourses  = courses.filter(c => c.mine);
  const favCourses = courses.filter(c => favoriteSet.has(c.id));
  const list = seg === "favs" ? favCourses : myCourses;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 18px 0", flexShrink: 0, background: "var(--bg-cream)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>저장한 코스</h1>

        <div style={{ display: "flex", gap: 0, marginTop: 14, background: "var(--bg-soft)",
                      padding: 4, borderRadius: 999, border: "1px solid var(--border-warm)" }}>
          {(["favs", "mine"] as const).map(s => {
            const isOn = seg === s;
            const count = s === "favs" ? favCourses.length : myCourses.length;
            return (
              <button key={s} onClick={() => setSeg(s)} style={{
                flex: 1, height: 36, borderRadius: 999,
                background: isOn ? "var(--bg-card)" : "transparent",
                border: "none", cursor: "pointer",
                color: isOn ? "var(--text-1)" : "var(--text-3)",
                fontWeight: 800, fontSize: 13, fontFamily: "inherit",
                boxShadow: isOn ? "var(--shadow-card)" : "none",
                transition: "all 0.18s ease",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <span style={{ fontSize: 14 }}>{s === "favs" ? "😊" : "🎒"}</span>
                <span>{s === "favs" ? "즐겨찾기" : "내가 만든"}</span>
                <span style={{ minWidth: 18, padding: "0 5px", height: 18, borderRadius: 999,
                               fontSize: 10.5, fontWeight: 800,
                               background: isOn ? (s === "favs" ? "var(--yellow)" : "var(--mint)") : "var(--border-warm)",
                               color: "var(--text-1)", display: "inline-flex",
                               alignItems: "center", justifyContent: "center" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {list.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        paddingTop: 14, paddingBottom: 10 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>
              {list.length}개의 코스 · 총 {list.reduce((s, c) => s + c.distance, 0).toFixed(1)}km
            </span>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 4,
                             background: "transparent", border: "none", fontSize: 12,
                             fontWeight: 700, color: "var(--text-2)", cursor: "pointer",
                             fontFamily: "inherit" }}>
              {sort}순 <IconChevronDown size={14}/>
            </button>
          </div>
        )}
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 14px 110px" }}>
        {list.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            {list.map(c => (
              <div key={c.id} role="button" tabIndex={0}
                onClick={() => pickCourse(c.id)}
                onKeyDown={e => e.key === "Enter" && pickCourse(c.id)}
                style={{
                background: "var(--bg-card)", borderRadius: 22,
                border: "1px solid #F2EBDE", boxShadow: "var(--shadow-card)",
                padding: 10, cursor: "pointer", textAlign: "left",
                position: "relative", display: "flex", flexDirection: "column",
                fontFamily: "inherit", gap: 8,
              }}>
                <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
                  <MiniMap path={c.path} color={c.color}/>
                  <button className={`smile ${favoriteSet.has(c.id) ? "is-on" : ""}`}
                    onClick={e => { e.stopPropagation(); toggleFavorite(c.id); }}
                    style={{ position: "absolute", top: 6, right: 6, width: 30, height: 30 }}
                    aria-label="즐겨찾기">
                    <SmileFavorite on={favoriteSet.has(c.id)}/>
                  </button>
                  {c.mine && (
                    <div style={{ position: "absolute", top: 6, left: 6,
                                  background: "var(--text-1)", color: "#fff",
                                  fontSize: 9, fontWeight: 800, padding: "3px 7px",
                                  borderRadius: 999, letterSpacing: "0.02em" }}>내가 만든</div>
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
                    {c.tags.slice(0, 2).map(t => (
                      <span key={t.text} className={`chip-tag ${t.color}`}
                            style={{ fontSize: 10, padding: "0 7px", height: 20 }}>
                        #{t.text}
                      </span>
                    ))}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--text-1)",
                               letterSpacing: "-0.01em", overflow: "hidden",
                               textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>{c.distance}km</span>
                    <span className="dot-divider"/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>{c.minutes}분</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 14, padding: "40px 24px" }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: "var(--bg-soft)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 36, border: "1px solid var(--border-warm)" }}>
              {seg === "favs" ? "😊" : "🎒"}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>
                {seg === "favs" ? "아직 저장한 코스가 없어요" : "아직 만든 코스가 없어요"}
              </div>
              <p style={{ margin: "6px 0 0", color: "var(--text-3)", fontSize: 13, lineHeight: 1.5 }}>
                {seg === "favs"
                  ? "마음에 드는 코스에 😊를 눌러보세요."
                  : "오른쪽 아래 + 버튼으로 새 코스를 그릴 수 있어요."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MeView ───────────────────────────────────────────────────────────────────
function MeView({ currentUser, favoriteCount, mineCount, totalKm, onRenameUser }: {
  currentUser: { displayName: string; avatarColors: [string, string] };
  favoriteCount: number; mineCount: number; totalKm: number;
  onRenameUser: (name: string) => Promise<void>;
}) {
  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [draft, setDraft] = useState(currentUser.displayName);
  const [saving, setSaving] = useState(false);

  const handleNicknameSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === currentUser.displayName) { setNicknameEdit(false); return; }
    setSaving(true);
    await onRenameUser(trimmed);
    setSaving(false);
    setNicknameEdit(false);
  };

  const stats = [
    { v: mineCount, k: "만든 코스" },
    { v: favoriteCount, k: "즐겨찾기" },
    { v: `${totalKm.toFixed(1)}km`, k: "내 코스 합" },
  ];
  const menuItems = [
    { icon: "🎒", label: "내가 만든 코스",      sub: `${mineCount}개`,     color: "mint"  },
    { icon: "😊", label: "즐겨찾기",            sub: `${favoriteCount}개`, color: "yellow"},
    { icon: "📤", label: "코스 내보내기 (GPX)", sub: "준비중",             color: "sky"   },
    { icon: "🔗", label: "공유 링크로 가져오기", sub: "준비중",             color: "pink"  },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px 110px" }}>
      {/* 프로필 카드 */}
      <div style={{ background: "var(--bg-card)", borderRadius: 24,
                    border: "1px solid #F2EBDE", boxShadow: "var(--shadow-card)", padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, flexShrink: 0,
                        background: `linear-gradient(135deg, ${currentUser.avatarColors[0]}, ${currentUser.avatarColors[1]})`,
                        border: "3px solid #fff",
                        boxShadow: "0 0 0 2px var(--border-warm), 0 6px 12px -4px rgba(120,90,60,0.18)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28 }}>🐣</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>
              {currentUser.displayName}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3, lineHeight: 1.4 }}>
              로그인 없이 시작했어요<br/>서버에 임시 저장 중이에요 🌿
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
                      marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-warm)" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginTop: 2 }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 닉네임 변경 */}
      <div style={{ background: "var(--bg-card)", borderRadius: 22, marginTop: 14,
                    border: "1px solid #F2EBDE", overflow: "hidden" }}>
        {nicknameEdit ? (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>닉네임 변경</div>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, 20))}
              onKeyDown={e => { if (e.key === "Enter") { void handleNicknameSave(); } if (e.key === "Escape") setNicknameEdit(false); }}
              autoFocus
              maxLength={20}
              placeholder="닉네임 입력 (최대 20자)"
              style={{
                height: 44, borderRadius: 12, border: "1.5px solid var(--border-warm)",
                padding: "0 14px", fontSize: 14, fontFamily: "inherit",
                background: "var(--bg-cream)", color: "var(--text-1)", outline: "none",
                fontWeight: 600,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setNicknameEdit(false)} style={{
                flex: 1, height: 40, borderRadius: 12, border: "1.5px solid var(--border-warm)",
                background: "transparent", fontWeight: 700, fontSize: 13.5,
                color: "var(--text-2)", fontFamily: "inherit", cursor: "pointer",
              }}>취소</button>
              <button onClick={() => void handleNicknameSave()} disabled={saving} style={{
                flex: 2, height: 40, borderRadius: 12, border: "none",
                background: "var(--mint)", fontWeight: 800, fontSize: 13.5,
                color: "var(--text-1)", fontFamily: "inherit", cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}>{saving ? "저장 중…" : "저장하기"}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setDraft(currentUser.displayName); setNicknameEdit(true); }} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", width: "100%",
            background: "transparent", border: "none", cursor: "pointer",
            textAlign: "left", fontFamily: "inherit",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "var(--lilac-soft)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18 }}>📝</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>닉네임 변경하기</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                {currentUser.displayName}
              </div>
            </div>
            <IconChevronDown size={16} style={{ transform: "rotate(-90deg)" } as React.CSSProperties}/>
          </button>
        )}
      </div>

      {/* 메뉴 목록 */}
      <div style={{ background: "var(--bg-card)", borderRadius: 22, marginTop: 14,
                    border: "1px solid #F2EBDE", overflow: "hidden" }}>
        {menuItems.map((r, i) => (
          <button key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", width: "100%",
            background: "transparent", border: "none", cursor: "pointer",
            textAlign: "left", fontFamily: "inherit",
            borderBottom: i < menuItems.length - 1 ? "1px solid var(--border-warm)" : "none",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 12,
                          background: `var(--${r.color}-soft)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{r.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{r.sub}</div>
            </div>
            <IconChevronDown size={16} style={{ transform: "rotate(-90deg)" } as React.CSSProperties}/>
          </button>
        ))}
      </div>

      <p style={{ marginTop: 18, padding: 14, borderRadius: 16,
                  background: "var(--bg-soft)", border: "1px solid var(--border-warm)",
                  color: "var(--text-3)", fontSize: 11.5, lineHeight: 1.6, textAlign: "center" }}>
        🍀 뜀로그 v0.1 · 1인 개발자가 만든 러닝 코스 아카이브<br/>
        로그인 없이, 광고 없이, 부담 없이.
      </p>
    </div>
  );
}
