"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Course, SnapPosition } from "@/lib/dduim/types";
import { AREAS, baseCourses, COLOR_BG, COLOR_INK, FAVORITE_KEY, FILTER_OPTIONS, MINE_KEY, navItems, POSTS } from "@/lib/dduim/data";
import type { TabId } from "@/lib/dduim/data";
import { readJson } from "@/lib/dduim/utils";
import { BottomSheet } from "@/components/dduim/BottomSheet";
import { CourseCard } from "@/components/dduim/CourseCard";
import { DrawingMode } from "@/components/dduim/DrawingMode";
import { IconBookmark, IconChevronDown, IconCompass, IconMap, IconPlus, IconSearch, IconUser, ShoeGlyph, SmileFavorite } from "@/components/dduim/icons";
import { KakaoMapView } from "@/components/dduim/KakaoMapView";
import { MiniMap } from "@/components/dduim/MiniMap";
import { MyCourseLines } from "@/components/dduim/MyCourseLines";

export default function Home() {
  const [tab, setTab] = useState<TabId>("home");
  const [activeId, setActiveId] = useState(baseCourses[0].id);
  const [filter, setFilter] = useState("전체");
  const [snap, setSnap] = useState<SnapPosition>("mid");
  const [favorites, setFavorites] = useState<string[]>(() => readJson<string[]>(FAVORITE_KEY, []));
  const [myCourses, setMyCourses] = useState<Course[]>(() => readJson<Course[]>(MINE_KEY, []));
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [toast, setToast] = useState("");

  const courses = useMemo(() => [...myCourses, ...baseCourses], [myCourses]);
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
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
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(FAVORITE_KEY, JSON.stringify(next));
      showToast(next.includes(id) ? "즐겨찾기에 저장했어요" : "즐겨찾기에서 뺐어요");
      return next;
    });
  };

  const saveMine = (course: Course) => {
    setMyCourses(prev => {
      const next = [course, ...prev];
      localStorage.setItem(MINE_KEY, JSON.stringify(next));
      return next;
    });
    setActiveId(course.id);
    setTab("home");
    setDrawingOpen(false);
    showToast("코스가 저장됐어요 🎒");
  };

  const pickCourse = (id: string) => { setActiveId(id); setTab("home"); setSnap("peek"); };

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
          />
        )}
        {tab === "feed" && (
          <FeedView courses={courses} favoriteSet={favoriteSet} toggleFavorite={toggleFavorite}/>
        )}
        {tab === "saves" && (
          <SavesView courses={courses} favoriteSet={favoriteSet}
            toggleFavorite={toggleFavorite} pickCourse={pickCourse}/>
        )}
        {tab === "me" && (
          <MeView
            favoriteCount={favorites.length}
            mineCount={myCourses.length}
            totalKm={myCourses.reduce((s, c) => s + c.distance, 0)}
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
                  {(favorites.length + myCourses.length) > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 6, minWidth: 16,
                                   height: 16, padding: "0 4px", borderRadius: 999,
                                   background: "var(--pink-deep)", color: "#fff",
                                   fontSize: 9, fontWeight: 800, display: "flex",
                                   alignItems: "center", justifyContent: "center" }}>
                      {favorites.length + myCourses.length}
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
          <DrawingMode onExit={() => setDrawingOpen(false)} onSave={saveMine}/>
        )}
        <div className={`toast ${toast ? "is-show" : ""}`}>{toast}</div>
      </section>
    </main>
  );
}

// ─── ExploreView ──────────────────────────────────────────────────────────────
function ExploreView({ activeCourse, activeId, courses, favoriteSet, filter,
  orderedCourses, setActiveId, setFilter, toggleFavorite, visibleCourses, snap, setSnap }: {
  activeCourse?: Course; activeId: string; courses: Course[];
  favoriteSet: Set<string>; filter: string; orderedCourses: Course[];
  setActiveId: (id: string) => void; setFilter: (f: string) => void;
  toggleFavorite: (id: string) => void; visibleCourses: Course[];
  snap: SnapPosition; setSnap: (s: SnapPosition) => void;
}) {
  const [areaId, setAreaId] = useState("yeouido");
  const [areaOpen, setAreaOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const currentArea = AREAS.find(a => a.id === areaId) || AREAS[0];

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
          <div ref={areaRef} style={{ position: "relative" }}>
            <button onClick={() => setAreaOpen(o => !o)} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: areaOpen ? "var(--bg-soft)" : "transparent",
              border: "none", padding: "4px 8px 4px 6px", borderRadius: 999,
              cursor: "pointer", color: "var(--text-1)", fontFamily: "inherit",
              transition: "background 0.15s ease",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 999,
                             background: currentArea.dot, display: "inline-block" }}/>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {currentArea.name}
              </span>
              <IconChevronDown size={14} style={{ transition: "transform 0.2s ease",
                transform: areaOpen ? "rotate(180deg)" : "rotate(0)" } as React.CSSProperties}/>
            </button>

            {areaOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 280,
                            background: "var(--bg-card)", borderRadius: 22,
                            border: "1px solid var(--border-warm)",
                            boxShadow: "0 16px 40px -12px rgba(60,40,20,0.25), 0 4px 8px rgba(60,40,20,0.08)",
                            zIndex: 50, overflow: "hidden",
                            animation: "dropdown-in 0.18s cubic-bezier(0.32, 0.72, 0.24, 1)",
                            transformOrigin: "top left" }}>
                <div style={{ padding: "12px 16px 8px", display: "flex",
                              alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)",
                                 letterSpacing: "0.04em", textTransform: "uppercase" }}>지역 선택</span>
                  <button onClick={() => setAreaOpen(false)} style={{
                    background: "transparent", border: "none", padding: "2px 4px",
                    fontSize: 11, color: "var(--text-3)", cursor: "pointer",
                    fontFamily: "inherit", fontWeight: 600,
                  }}>📍 내 주변</button>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {AREAS.map(a => (
                    <button key={a.id} onClick={() => { setAreaId(a.id); setAreaOpen(false); }} style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%",
                      padding: "11px 16px",
                      background: a.id === areaId ? "var(--bg-soft)" : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      transition: "background 0.12s ease",
                    }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999,
                                     background: a.dot, flexShrink: 0 }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{a.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{a.sub}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
                                     background: "var(--bg-soft)", padding: "3px 8px",
                                     borderRadius: 999, flexShrink: 0 }}>{a.count}</span>
                      {a.id === areaId && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="var(--mint-deep)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
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
        <KakaoMapView courses={visibleCourses.filter(c => !c.mine)} activeId={activeId}
          onPick={id => { setActiveId(id); setSnap("peek"); }}/>
        <MyCourseLines courses={courses.filter(c => c.mine)} activeId={activeId}/>
        <div className="user-dot"/>

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
                {currentArea.name} 코스
              </h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)" }}>
                {visibleCourses.length}
              </span>
            </div>
          </div>
          <div className="sheet-content">
            {orderedCourses.map(c => (
              <CourseCard key={c.id} course={c} isActive={c.id === activeId}
                isSaved={favoriteSet.has(c.id)}
                onClick={() => { setActiveId(c.id); setSnap("peek"); }}
                onToggleSave={toggleFavorite}/>
            ))}
            {orderedCourses.length === 0 && (
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
function PostMapPreview({ course }: { course: Course }) {
  const ink = COLOR_INK[course.color] || "#2F8B6E";
  const bg  = COLOR_BG[course.color]  || "#DBF1E9";

  const xs   = course.path.map(p => p.x), ys = course.path.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(0.0001, maxX - minX), spanY = Math.max(0.0001, maxY - minY);
  const span  = Math.max(spanX, spanY), pad = 0.16;
  const norm  = (pt: { x: number; y: number }) => ({
    x: pad + ((pt.x - minX) / span + (span - spanX) / (2 * span)) * (1 - 2 * pad),
    y: pad + ((pt.y - minY) / span + (span - spanY) / (2 * span)) * (1 - 2 * pad),
  });
  const np = course.path.map(norm);
  const smooth = (pts: typeof np) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x * 100} ${pts[0].y * 100}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2 * 100;
      const my = (pts[i].y + pts[i + 1].y) / 2 * 100;
      d += ` Q ${pts[i].x * 100} ${pts[i].y * 100} ${mx} ${my}`;
    }
    d += ` T ${pts[pts.length - 1].x * 100} ${pts[pts.length - 1].y * 100}`;
    return d;
  };
  const d = smooth(np);

  return (
    <div style={{ width: "100%", aspectRatio: "1.55 / 1", background: bg,
                  position: "relative", overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 64" preserveAspectRatio="none"
           style={{ position: "absolute", inset: 0 }}>
        <g stroke="#fff" strokeWidth="0.3" opacity="0.5">
          {[8, 16, 24, 32, 40, 48, 56].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y}/>)}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => <line key={x} x1={x} y1="0" x2={x} y2="64"/>)}
        </g>
        <ellipse cx="80" cy="14" rx="20" ry="10" fill="#fff" opacity="0.4"/>
        <ellipse cx="14" cy="50" rx="16" ry="10" fill="#fff" opacity="0.45"/>
      </svg>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
           style={{ position: "absolute", inset: 0 }}>
        <path d={d} fill="none" stroke="#fff" strokeWidth="6" vectorEffect="non-scaling-stroke"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.15))" }}/>
        <path d={d} fill="none" stroke={ink} strokeWidth="3.4" vectorEffect="non-scaling-stroke"
              strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ position: "absolute", left: `${np[0].x * 100}%`, top: `${np[0].y * 100}%`,
                    transform: "translate(-50%, -50%)", width: 16, height: 16,
                    borderRadius: 999, background: ink, border: "3px solid #fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.18)" }}/>
      <div style={{ position: "absolute", left: `${np[np.length-1].x * 100}%`, top: `${np[np.length-1].y * 100}%`,
                    transform: "translate(-50%, -50%)", width: 12, height: 12,
                    borderRadius: 999, background: "#fff", border: `3px solid ${ink}`,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.18)" }}/>
      <div style={{ position: "absolute", top: 12, left: 12, display: "inline-flex",
                    alignItems: "center", gap: 4, background: "rgba(253,252,248,0.94)",
                    borderRadius: 999, padding: "5px 10px 5px 7px",
                    fontSize: 11, fontWeight: 700, color: "var(--text-1)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ShoeGlyph size={12}/>
        <span>{course.title}</span>
      </div>
    </div>
  );
}

function FeedView({ courses, favoriteSet, toggleFavorite }: {
  courses: Course[]; favoriteSet: Set<string>; toggleFavorite: (id: string) => void;
}) {
  const [feedFilter, setFeedFilter] = useState("최신");
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("dduim:liked:v1") || "[]")); }
    catch { return new Set(); }
  });
  const FEED_FILTERS = ["최신", "내 친구", "동네", "인기 많은"];

  const toggleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("dduim:liked:v1", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 18px 12px", flexShrink: 0, background: "var(--bg-cream)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>피드</h1>
        <div className="chips no-scrollbar" style={{ marginTop: 10 }}>
          {FEED_FILTERS.map(f => (
            <button key={f} className={`chip ${feedFilter === f ? "is-active" : ""}`}
              onClick={() => setFeedFilter(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto",
                                              padding: "14px 14px 110px",
                                              display: "flex", flexDirection: "column", gap: 14 }}>
        {POSTS.map(post => {
          const course = courses.find(c => c.id === post.courseId);
          if (!course) return null;
          const userLiked = likedIds.has(post.id) ? !post.isLiked : post.isLiked;
          const likeCount = post.likes + (userLiked && !post.isLiked ? 1 : !userLiked && post.isLiked ? -1 : 0);
          const min = Math.floor(post.record.totalSec / 60);
          const sec = post.record.totalSec % 60;

          return (
            <article key={post.id} style={{ background: "var(--bg-card)", borderRadius: 24,
                                            overflow: "hidden", border: "1px solid #F2EBDE",
                                            boxShadow: "var(--shadow-card)" }}>
              <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                              background: `linear-gradient(135deg, ${post.author.avatar[0]}, ${post.author.avatar[1]})` }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-1)" }}>{post.author.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{post.timeAgo}</div>
                </div>
                <button style={{ background: "transparent", border: "none", padding: 4,
                                 cursor: "pointer", color: "var(--text-3)" }} aria-label="더보기">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                  </svg>
                </button>
              </header>

              <PostMapPreview course={course}/>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                            padding: "12px 16px",
                            borderTop: "1px solid var(--border-warm)",
                            borderBottom: "1px solid var(--border-warm)",
                            background: "var(--bg-cream)" }}>
                {[
                  { v: post.record.km.toFixed(2), u: "km",  k: "거리" },
                  { v: `${min}:${String(sec).padStart(2, "0")}`, u: "", k: "시간" },
                  { v: `${post.record.paceMin}'${String(post.record.paceSec).padStart(2, "0")}"`, u: "", k: "페이스" },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid var(--border-warm)" : "none", padding: "0 4px" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)",
                                  letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                      {s.v}{s.u && <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 2, fontWeight: 700 }}>{s.u}</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600, marginTop: 3 }}>{s.k}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                  <button onClick={() => toggleLike(post.id)} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "transparent", border: "none", padding: "4px 6px",
                    cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit",
                    color: "var(--text-1)",
                  }}>
                    <span style={{ fontSize: 18, transition: "transform 0.2s ease",
                                   transform: userLiked ? "scale(1.12)" : "scale(1)" }}>
                      {userLiked ? "💛" : "🤍"}
                    </span>
                    <span>{likeCount.toLocaleString()}</span>
                  </button>
                  <button style={{ display: "inline-flex", alignItems: "center", gap: 6,
                                   background: "transparent", border: "none", padding: "4px 6px",
                                   cursor: "pointer", color: "var(--text-2)", marginLeft: 4,
                                   fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a8 8 0 0 1-12 7l-5 1 1-5a8 8 0 1 1 16-3z"/>
                    </svg>
                    <span>{post.comments.length}</span>
                  </button>
                  <div style={{ flex: 1 }}/>
                  <button className={`smile ${favoriteSet.has(course.id) ? "is-on" : ""}`}
                    onClick={() => toggleFavorite(course.id)}
                    style={{ width: 32, height: 32 }} aria-label="즐겨찾기">
                    <SmileFavorite on={favoriteSet.has(course.id)}/>
                  </button>
                </div>
                <p style={{ margin: 0, color: "var(--text-1)", fontSize: 13.5,
                            lineHeight: 1.5, fontWeight: 500 }}>
                  <span style={{ fontWeight: 700, marginRight: 6 }}>{post.author.name}</span>
                  {post.caption}
                </p>
                {post.comments.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {post.comments.slice(0, 2).map((c, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, marginRight: 6 }}>{c.who}</span>{c.text}
                      </div>
                    ))}
                    {post.comments.length > 2 && (
                      <button style={{ background: "transparent", border: "none", padding: "4px 0",
                                       color: "var(--text-3)", fontSize: 12, cursor: "pointer",
                                       fontFamily: "inherit" }}>
                        댓글 {post.comments.length}개 모두 보기
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
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
              <button key={c.id} onClick={() => pickCourse(c.id)} style={{
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
              </button>
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
function MeView({ favoriteCount, mineCount, totalKm }: {
  favoriteCount: number; mineCount: number; totalKm: number;
}) {
  const stats = [
    { v: mineCount, k: "만든 코스" },
    { v: favoriteCount, k: "즐겨찾기" },
    { v: `${totalKm.toFixed(1)}km`, k: "내 코스 합" },
  ];
  const actions = [
    { icon: "🎒", label: "내가 만든 코스",       sub: `${mineCount}개`,     color: "mint"  },
    { icon: "😊", label: "즐겨찾기",             sub: `${favoriteCount}개`, color: "yellow"},
    { icon: "📤", label: "코스 내보내기 (GPX)",   sub: "준비중",             color: "sky"   },
    { icon: "🔗", label: "공유 링크로 가져오기",  sub: "준비중",             color: "pink"  },
    { icon: "📝", label: "닉네임 정하기",         sub: "이름없는 러너",       color: "lilac" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px 110px" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 24,
                    border: "1px solid #F2EBDE", boxShadow: "var(--shadow-card)", padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999,
                        background: "linear-gradient(135deg, #FFE38C, #FFC9D0)",
                        border: "3px solid #fff",
                        boxShadow: "0 0 0 2px var(--border-warm), 0 6px 12px -4px rgba(120,90,60,0.18)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28 }}>🐣</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>이름없는 러너</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3, lineHeight: 1.4 }}>
              로그인 없이 시작했어요<br/>이 브라우저에만 저장됩니다 🔐
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

      <div style={{ background: "var(--bg-card)", borderRadius: 22, marginTop: 14,
                    border: "1px solid #F2EBDE", overflow: "hidden" }}>
        {actions.map((r, i) => (
          <button key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", width: "100%",
            background: "transparent", border: "none", cursor: "pointer",
            textAlign: "left", fontFamily: "inherit",
            borderBottom: i < actions.length - 1 ? "1px solid var(--border-warm)" : "none",
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
