"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Course, SnapPosition } from "@/lib/dduim/types";
import { AREAS, TAG_CATALOG, navItems } from "@/lib/dduim/data";
import type { TabId } from "@/lib/dduim/data";
import { useDduimStore } from "@/lib/dduim/store";
import { BottomSheet } from "@/components/dduim/BottomSheet";
import { CourseCard } from "@/components/dduim/CourseCard";
import { DrawingMode } from "@/components/dduim/DrawingMode";
import { IconBookmark, IconChevronDown, IconMap, IconPlus, IconSearch, IconUser, ShoeGlyph, SmileFavorite } from "@/components/dduim/icons";
import { OsmMapView } from "@/components/dduim/OsmMapView";
import { MiniMap } from "@/components/dduim/MiniMap";
import { MyCourseLines } from "@/components/dduim/MyCourseLines";

function getCourseIdFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("c") ?? "";
}

export default function Home() {
  const [tab, setTab] = useState<TabId>("home");
  const [activeId, setActiveId] = useState(() => getCourseIdFromUrl());
  const [sharedCourseId, setSharedCourseId] = useState(() => getCourseIdFromUrl());
  const [snap, setSnap] = useState<SnapPosition>("mid");
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; level: number }>({ lat: 37.52693, lng: 126.93447, level: 7 });
  const [toast, setToast] = useState("");
  const [limitModal, setLimitModal] = useState(false);
  const [distRange, setDistRange] = useState<"" | "short" | "mid" | "long">("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [linkedCourse, setLinkedCourse] = useState<Course | null>(null);
  const { userCourses, savedCourseIds, currentUser, ready, actions } = useDduimStore();
  const sharedCourseHandledRef = useRef(false);

  const courses = useMemo(() => {
    const mine = new Set(userCourses.map(c => c.id));
    return linkedCourse && !mine.has(linkedCourse.id) ? [...userCourses, linkedCourse] : userCourses;
  }, [linkedCourse, userCourses]);
  const favoriteSet = useMemo(() => new Set(savedCourseIds), [savedCourseIds]);
  const visibleCourses = useMemo(() => {
    let result = courses;
    if (distRange === "short") result = result.filter(c => c.distance <= 3);
    else if (distRange === "mid") result = result.filter(c => c.distance > 3 && c.distance <= 7);
    else if (distRange === "long") result = result.filter(c => c.distance > 7);
    return result;
  }, [courses, distRange]);
  const orderedCourses = useMemo(() =>
    [...visibleCourses].sort((a, b) => a.id === activeId ? -1 : b.id === activeId ? 1 : 0),
    [activeId, visibleCourses]);
  const activeCourse = courses.find(c => c.id === activeId);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1600);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const courseId = getCourseIdFromUrl();
      sharedCourseHandledRef.current = false;
      setSharedCourseId(courseId);
      setActiveId(courseId);
      if (courseId) {
        setTab("home");
        setSnap("mid");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!sharedCourseId || sharedCourseHandledRef.current) return;

    if (activeCourse) {
      sharedCourseHandledRef.current = true;
      window.setTimeout(() => {
        setTab("home");
        setActiveId(sharedCourseId);
        setSnap("mid");
        showToast("링크 코스를 열었어요");
      }, 0);
      return;
    }

    if (ready) {
      fetch(`/api/courses/${encodeURIComponent(sharedCourseId)}`)
        .then((res) => res.ok ? res.json() as Promise<Course> : null)
        .then((course) => {
          sharedCourseHandledRef.current = true;
          if (!course) {
            showToast("코스를 찾지 못했어요");
            return;
          }
          setLinkedCourse(course);
          setActiveId(course.id);
          setTab("home");
          setSnap("mid");
          showToast("링크 코스를 열었어요");
        })
        .catch(() => {
          sharedCourseHandledRef.current = true;
          showToast("코스를 찾지 못했어요");
        });
    }
  }, [activeCourse, ready, sharedCourseId, showToast]);

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
    showToast("나만의 코스로 저장됐어요");
  };

  const saveSharedCourse = async (id: string) => {
    const course = courses.find(c => c.id === id);
    if (!course || course.mine) return;

    const copy: Course = {
      ...course,
      id: `copy-${course.id}-${crypto.randomUUID()}`,
      author: currentUser.displayName,
      mine: true,
      ownerId: currentUser.id,
      saves: 0,
      source: "user",
      visibility: "private",
      createdAt: undefined,
      updatedAt: undefined,
      deletedAt: null,
    };

    const result = await actions.saveUserCourse(copy);
    if (result.limitReached) { setLimitModal(true); return; }

    setLinkedCourse(null);
    setSharedCourseId("");
    window.history.replaceState(null, "", window.location.pathname);
    setActiveId(copy.id);
    setTab("home");
    setSnap("peek");
    showToast("내 코스로 저장했어요");
  };

  const pickCourse = (id: string) => { setActiveId(id); setTab("home"); setSnap("peek"); };

  const shareCourse = async (id: string) => {
    const course = courses.find(c => c.id === id);
    if (!course?.mine) return;
    if (course.visibility === "private") {
      const updated = await actions.updateCourse(id, { visibility: "unlisted" });
      if (!updated) {
        showToast("링크를 만들지 못했어요");
        return;
      }
    }
    const url = `${window.location.origin}/?c=${encodeURIComponent(id)}`;
    const title = course ? `뜀로그 - ${course.title}` : "뜀로그 코스";
    const text = course
      ? `${course.title} · ${course.distance.toFixed(1)}km 코스`
      : "뜀로그에서 코스를 확인해보세요";

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        showToast("코스 링크를 만들었어요");
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    const copied = await copyTextToClipboard(url);
    showToast(copied ? "코스 링크를 복사했어요" : "링크 복사에 실패했어요");
  };

  return (
    <main className="stage">
      <section className="app-viewport" aria-label="뜀로그 앱">
        {tab === "home" && (
          <ExploreView
            activeCourse={activeCourse} activeId={activeId} courses={courses}
            favoriteSet={favoriteSet} orderedCourses={orderedCourses}
            setActiveId={id => { setActiveId(id); setSnap("peek"); }}
            visibleCourses={visibleCourses} snap={snap} setSnap={setSnap}
            onCenterChange={setMapCenter}
            onShare={shareCourse}
            onSaveSharedCourse={saveSharedCourse}
            onStartDrawing={() => setDrawingOpen(true)}
            distRange={distRange} setDistRange={setDistRange}
          />
        )}
        {tab === "saves" && (
          <SavesView courses={courses} favoriteSet={favoriteSet}
            toggleFavorite={toggleFavorite} pickCourse={pickCourse}
            onEditCourse={c => setEditingCourse(c)}/>
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

        {editingCourse && (
          <EditCourseSheet
            course={editingCourse}
            onClose={() => setEditingCourse(null)}
            onSave={async (patch) => {
              await actions.updateCourse(editingCourse.id, patch);
              setEditingCourse(null);
              showToast("코스를 수정했어요 ✏️");
            }}
          />
        )}

        <nav className="bottom-nav" aria-label="주요 메뉴">
          {navItems.map(item => (
            <button key={item.id} className={`nav-btn ${tab === item.id ? "is-active" : ""}`}
              onClick={() => setTab(item.id)} style={{ position: "relative" }}>
              {item.id === "home"  && <IconMap size={20}/>}
              {item.id === "saves" && (
                <>
                  <IconBookmark size={20}/>
                  {userCourses.length > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 6, minWidth: 16,
                                   height: 16, padding: "0 4px", borderRadius: 999,
                                   background: "var(--pink-deep)", color: "#fff",
                                   fontSize: 9, fontWeight: 800, display: "flex",
                                   alignItems: "center", justifyContent: "center" }}>
                      {userCourses.length}
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
async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below handles browsers that block async clipboard access.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

type DistRange = "" | "short" | "mid" | "long";

type PlaceSearchResult = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  name: string;
  type: string;
};

function ExploreView({ activeCourse, activeId, courses, favoriteSet,
  orderedCourses, setActiveId, visibleCourses, snap, setSnap,
  onCenterChange, onShare, onSaveSharedCourse, onStartDrawing, distRange, setDistRange }: {
  activeCourse?: Course; activeId: string; courses: Course[];
  favoriteSet: Set<string>; orderedCourses: Course[];
  setActiveId: (id: string) => void;
  visibleCourses: Course[];
  snap: SnapPosition; setSnap: (s: SnapPosition) => void;
  onCenterChange?: (center: { lat: number; lng: number; level: number }) => void;
  onShare?: (id: string) => void;
  onSaveSharedCourse?: (id: string) => void;
  onStartDrawing: () => void;
  distRange: DistRange; setDistRange: (v: DistRange) => void;
}) {
  const [areaId, setAreaId] = useState("all");
  const [areaOpen, setAreaOpen] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number; level: number } | undefined>(undefined);
  const [filterOpen, setFilterOpen] = useState(false);
  const [routeFirstDismissed, setRouteFirstDismissed] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [placeSearchStatus, setPlaceSearchStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const activeFilterCount = distRange ? 1 : 0;
  const areaRef = useRef<HTMLDivElement>(null);
  const placeSearchRef = useRef<HTMLDivElement>(null);

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
  const showRouteFirstPanel = !routeFirstDismissed && courses.length === 0;

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

  useEffect(() => {
    const query = placeQuery.trim();
    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPlaceSearchStatus("loading");
      fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.ok ? res.json() as Promise<{ results?: PlaceSearchResult[] }> : { results: [] })
        .then((data) => {
          setPlaceResults(data.results ?? []);
          setPlaceSearchStatus("done");
          setPlaceSearchOpen(true);
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setPlaceResults([]);
          setPlaceSearchStatus("error");
          setPlaceSearchOpen(true);
        });
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [placeQuery]);

  useEffect(() => {
    if (!placeSearchOpen) return;
    const close = (e: MouseEvent) => {
      if (placeSearchRef.current && !placeSearchRef.current.contains(e.target as Node)) {
        setPlaceSearchOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setPlaceSearchOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [placeSearchOpen]);

  const pickPlace = (place: PlaceSearchResult) => {
    setPanTarget({ lat: place.lat, lng: place.lng, level: 16 });
    setPlaceQuery(place.name);
    setPlaceSearchOpen(false);
    setAreaOpen(false);
    setFilterOpen(false);
    setSnap("peek");
  };

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

          <div style={{ flex: 1 }}/>

          {/* 필터 버튼 */}
          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
              background: (filterOpen || activeFilterCount > 0) ? "var(--text-1)" : "var(--bg-soft)",
              color: (filterOpen || activeFilterCount > 0) ? "var(--bg-cream)" : "var(--text-2)",
              border: "1px solid",
              borderColor: (filterOpen || activeFilterCount > 0) ? "var(--text-1)" : "var(--border-warm)",
              borderRadius: 999, height: 30, padding: "0 11px",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "background 0.15s, color 0.15s, border-color 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="5" x2="17" y2="5"/>
              <line x1="3" y1="10" x2="17" y2="10"/>
              <line x1="3" y1="15" x2="17" y2="15"/>
              <circle cx="7" cy="5" r="2" fill="currentColor" stroke="none"/>
              <circle cx="13" cy="10" r="2" fill="currentColor" stroke="none"/>
              <circle cx="8" cy="15" r="2" fill="currentColor" stroke="none"/>
            </svg>
            필터
            {activeFilterCount > 0 && (
              <span style={{
                background: "var(--mint-deep)", color: "#fff",
                borderRadius: 999, fontSize: 10, fontWeight: 800,
                padding: "1px 5px", lineHeight: "1.5", marginLeft: 1,
              }}>{activeFilterCount}</span>
            )}
            <IconChevronDown size={12} style={{
              transition: "transform 0.2s ease",
              transform: filterOpen ? "rotate(180deg)" : "rotate(0)",
            } as React.CSSProperties}/>
          </button>
        </div>

        {/* 오버레이 필터 드로어 — 레이아웃 부종 없음 */}
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-warm)",
          boxShadow: "0 8px 24px -4px rgba(60,40,20,0.15)",
          zIndex: 45,
          overflow: "hidden",
          maxHeight: filterOpen ? 170 : 0,
          transition: "max-height 0.26s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 거리 */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>거리</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["short", "mid", "long"] as DistRange[]).map((key, i) => (
                  <button key={key}
                    className={`chip ${distRange === key ? "is-active" : ""}`}
                    onClick={() => setDistRange(distRange === key ? "" : key)}
                  >
                    {["~3km", "3~7km", "7km+"][i]}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <section className="map-shell">
        <OsmMapView courses={areaFilteredVisible} activeId={activeId}
          favoriteIds={favoriteSet}
          panToLatLng={panTarget}
          onCenterChange={onCenterChange}
          onPick={id => { setActiveId(id); setSnap("peek"); }}/>
        <MyCourseLines courses={courses.filter(c => c.mine && !c.geoPath?.length)} activeId={activeId}/>

        <div className="place-search-floating" ref={placeSearchRef}>
          <form
            className={`place-search-box ${placeSearchOpen ? "is-open" : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              if (placeResults[0]) pickPlace(placeResults[0]);
              else if (placeQuery.trim().length >= 2) setPlaceSearchOpen(true);
            }}
          >
            <IconSearch size={17} color="var(--mint-ink)"/>
            <input
              aria-label="장소 검색"
              value={placeQuery}
              onChange={(event) => {
                const value = event.target.value;
                setPlaceQuery(value);
                setPlaceSearchOpen(true);
                if (value.trim().length < 2) {
                  setPlaceResults([]);
                  setPlaceSearchStatus("idle");
                }
              }}
              onFocus={() => {
                if (placeQuery.trim().length >= 2 || placeResults.length > 0) setPlaceSearchOpen(true);
              }}
              placeholder="원흥역 같은 장소 검색"
            />
            {placeQuery && (
              <button
                type="button"
                className="place-search-clear"
                onClick={() => {
                  setPlaceQuery("");
                  setPlaceResults([]);
                  setPlaceSearchOpen(false);
                  setPlaceSearchStatus("idle");
                }}
                aria-label="검색어 지우기"
              >
                ×
              </button>
            )}
          </form>

          {placeSearchOpen && placeQuery.trim().length >= 2 && (
            <div className="place-search-results">
              {placeSearchStatus === "loading" && (
                <div className="place-search-message">찾는 중...</div>
              )}
              {placeSearchStatus === "error" && (
                <div className="place-search-message">장소를 찾지 못했어요</div>
              )}
              {placeSearchStatus === "done" && placeResults.length === 0 && (
                <div className="place-search-message">검색 결과가 없어요</div>
              )}
              {placeResults.map((place) => (
                <button key={place.id} type="button" onClick={() => pickPlace(place)}>
                  <span>{place.name}</span>
                  {place.label && <small>{place.label}</small>}
                </button>
              ))}
            </div>
          )}
        </div>

        {showRouteFirstPanel && (
          <div className="route-first-panel">
            <button
              className="route-first-close"
              type="button"
              onClick={() => setRouteFirstDismissed(true)}
              aria-label="안내 닫기"
            >
              ×
            </button>
            <div className="route-first-kicker">오늘 어디 뛰지?</div>
            <h1>지도를 톡톡 찍어서<br/>러닝 코스를 미리 만들어봐요</h1>
            <p>거리와 예상 시간을 먼저 보고, 마음에 들면 내 코스로 저장하면 돼요.</p>
            <div className="route-first-presets" aria-label="거리 프리셋">
              {["3km", "5km", "7km", "왕복"].map((label) => (
                <button key={label} type="button" onClick={onStartDrawing}>{label}</button>
              ))}
            </div>
            <button className="route-first-cta" type="button" onClick={onStartDrawing}>
              <IconPlus size={18} color="#FDFCF8"/>
              코스 찍기 시작
            </button>
          </div>
        )}
        {activeId && activeCourse && (
          <div className={`active-route-pill ${!activeCourse.mine ? "has-save-action" : ""}`}>
            <div className="shoe-mark"><ShoeGlyph size={12}/></div>
            <strong>{activeCourse.title}</strong>
            {!activeCourse.mine && onSaveSharedCourse && (
              <button
                className="active-route-save"
                type="button"
                onClick={() => onSaveSharedCourse(activeCourse.id)}
              >
                내 코스로 저장
              </button>
            )}
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
                onShare={onShare && c.mine ? () => onShare(c.id) : undefined}/>
            ))}
            {areaFilteredOrdered.length === 0 && (
              <div className="route-empty-state">
                <div className="route-empty-icon">
                  <IconMap size={22} color="var(--mint-ink)"/>
                </div>
                <strong>아직 보여줄 코스가 없어요</strong>
                <p>빈 동네처럼 보이기 전에, 이 지역 첫 러닝 코스를 직접 찍어보세요.</p>
                <button type="button" onClick={onStartDrawing}>이 동네 첫 코스 만들기</button>
              </div>
            )}
            {false && areaFilteredOrdered.length === 0 && (
              <div className="route-empty-state">
                <div className="route-empty-icon">
                  <IconMap size={22} color="var(--mint-ink)"/>
                </div>
                <strong>아직 보여줄 코스가 없어요</strong>
                <p>빈 동네처럼 보이기 전에, 이 지역 첫 러닝 코스를 직접 찍어보세요.</p>
                <button type="button" onClick={onStartDrawing}>이 동네 첫 코스 만들기</button>
                조건에 맞는 코스가 아직 없어요 🐣
              </div>
            )}
          </div>
        </BottomSheet>
      </section>
    </>
  );
}

// ─── SavesView ────────────────────────────────────────────────────────────────
function SavesView({ courses, favoriteSet, toggleFavorite, pickCourse, onEditCourse }: {
  courses: Course[]; favoriteSet: Set<string>;
  toggleFavorite: (id: string) => void; pickCourse: (id: string) => void;
  onEditCourse?: (c: Course) => void;
}) {
  const [seg, setSeg] = useState<"favs" | "mine">("mine");
  const sort = "최근";

  const myCourses  = courses.filter(c => c.mine);
  const list = myCourses;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 18px 0", flexShrink: 0, background: "var(--bg-cream)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>저장한 코스</h1>

        <div style={{ display: "flex", gap: 0, marginTop: 14, background: "var(--bg-soft)",
                      padding: 4, borderRadius: 999, border: "1px solid var(--border-warm)" }}>
          {(["mine"] as const).map(s => {
            const isOn = seg === s;
            const count = myCourses.length;
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
                <span style={{ fontSize: 14 }}>🎒</span>
                <span>내가 만든</span>
                <span style={{ minWidth: 18, padding: "0 5px", height: 18, borderRadius: 999,
                               fontSize: 10.5, fontWeight: 800,
                               background: isOn ? "var(--mint)" : "var(--border-warm)",
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
              <div key={c.id} style={{ position: "relative", paddingTop: c.mine && onEditCourse ? 14 : 0 }}>
                {c.mine && onEditCourse && (
                  <button
                    onClick={e => { e.stopPropagation(); onEditCourse(c); }}
                    aria-label="코스 수정"
                    style={{
                      position: "absolute", top: 0, right: 0, zIndex: 2,
                      width: 28, height: 28, borderRadius: 999,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-warm)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--text-2)",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                    </svg>
                  </button>
                )}
                <div role="button" tabIndex={0}
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
                    style={{ display: "none", position: "absolute", top: 6, right: 6, width: 30, height: 30 }}
                    aria-label="즐겨찾기">
                    <SmileFavorite on={favoriteSet.has(c.id)}/>
                  </button>
                  {c.mine && (
                    <div style={{ position: "absolute", top: 6, left: 6 }}>
                      <div style={{ background: "var(--text-1)", color: "#fff",
                                    fontSize: 9, fontWeight: 800, padding: "3px 7px",
                                    borderRadius: 999, letterSpacing: "0.02em" }}>내가 만든</div>
                    </div>
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

// ─── EditCourseSheet ──────────────────────────────────────────────────────────
function EditCourseSheet({ course, onClose, onSave }: {
  course: Course;
  onClose: () => void;
  onSave: (patch: { title?: string; tags?: Course["tags"]; visibility?: Course["visibility"] }) => Promise<void>;
}) {
  const [title, setTitle] = useState(course.title);
  const [selectedTags, setSelectedTags] = useState<Course["tags"]>(course.tags);
  const [visibility, setVisibility] = useState<Course["visibility"]>(course.visibility ?? "private");
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: (typeof TAG_CATALOG)[number]) => {
    const already = selectedTags.find(t => t.text === tag.text);
    if (already) {
      setSelectedTags(selectedTags.filter(t => t.text !== tag.text));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ title: title.trim(), tags: selectedTags, visibility });
    setSaving(false);
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(30,24,18,0.45)",
          zIndex: 200, backdropFilter: "blur(2px)",
        }}
      />
      {/* 바텀시트 패널 */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-card)",
        borderRadius: "28px 28px 0 0",
        border: "1px solid var(--border-warm)",
        boxShadow: "0 -8px 40px -8px rgba(60,40,20,0.2)",
        zIndex: 201,
        padding: "0 0 calc(env(safe-area-inset-bottom) + 16px)",
        animation: "sheet-up 0.28s cubic-bezier(0.32,0.72,0.24,1)",
        maxHeight: "85dvh",
        overflowY: "auto",
      }}>
        {/* 핸들 */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border-warm)" }}/>
        </div>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", padding: "4px 20px 16px" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text-1)", flex: 1 }}>
            코스 수정
          </h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 999, border: "none",
            background: "var(--bg-soft)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-3)", fontSize: 18, fontFamily: "inherit",
          }}>×</button>
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 코스 이름 */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
                            letterSpacing: "0.05em", textTransform: "uppercase",
                            display: "block", marginBottom: 8 }}>코스 이름</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 30))}
              placeholder="코스 이름을 입력하세요"
              maxLength={30}
              style={{
                width: "100%", height: 48, borderRadius: 14,
                border: "1.5px solid var(--border-warm)",
                padding: "0 14px", fontSize: 15, fontFamily: "inherit",
                background: "var(--bg-cream)", color: "var(--text-1)",
                outline: "none", fontWeight: 600, boxSizing: "border-box",
              }}
            />
          </div>

          {/* 태그 */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
                            letterSpacing: "0.05em", textTransform: "uppercase",
                            display: "block", marginBottom: 4 }}>태그 (최대 3개)</label>
            <p style={{ fontSize: 12, color: "var(--text-4)", margin: "0 0 10px" }}>
              {selectedTags.length}/3 선택됨
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {TAG_CATALOG.map(tag => {
                const active = selectedTags.some(t => t.text === tag.text);
                const disabled = !active && selectedTags.length >= 3;
                return (
                  <button
                    key={tag.text}
                    onClick={() => toggleTag(tag)}
                    disabled={disabled}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      height: 32, padding: "0 12px", borderRadius: 999,
                      border: active ? "1.5px solid var(--mint-deep)" : "1px solid var(--border-warm)",
                      background: active ? "var(--mint)" : "var(--bg-soft)",
                      color: active ? "var(--mint-deep)" : disabled ? "var(--text-4)" : "var(--text-2)",
                      fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                      cursor: disabled ? "default" : "pointer",
                      opacity: disabled ? 0.45 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{tag.emoji}</span>
                    <span>#{tag.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 공개 여부 */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
                            letterSpacing: "0.05em", textTransform: "uppercase",
                            display: "block", marginBottom: 8 }}>공개 여부</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([["private", "나만 보기"], ["unlisted", "링크로만 보기"]] as const).map(([val, label]) => (
                <button key={val} onClick={() => setVisibility(val)} style={{
                  flex: 1, height: 42, borderRadius: 14,
                  border: visibility === val ? "1.5px solid var(--mint-deep)" : "1px solid var(--border-warm)",
                  background: visibility === val ? "var(--mint)" : "var(--bg-soft)",
                  color: visibility === val ? "var(--mint-deep)" : "var(--text-2)",
                  fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                  transition: "all 0.15s",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={() => void handleSave()}
            disabled={saving || !title.trim()}
            style={{
              height: 52, borderRadius: 18, border: "none",
              background: saving || !title.trim() ? "var(--border-warm)" : "var(--mint-deep)",
              color: saving || !title.trim() ? "var(--text-3)" : "#fff",
              fontSize: 15, fontWeight: 800, fontFamily: "inherit",
              cursor: saving || !title.trim() ? "default" : "pointer",
              transition: "background 0.15s, color 0.15s",
              marginBottom: 4,
            }}
          >
            {saving ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </div>
    </>
  );
}
