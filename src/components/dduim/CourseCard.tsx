import type { Course } from "@/lib/dduim/types";
import { MiniMap } from "./MiniMap";
import { SmileFavorite } from "./icons";

export function CourseCard({ course, isActive, isSaved, onClick, onToggleSave, onShare, onEdit }: {
  course: Course; isActive: boolean; isSaved: boolean;
  onClick: () => void; onToggleSave?: (id: string) => void;
  onShare?: () => void; onEdit?: () => void;
}) {
  return (
    <article className={`course-card ${isActive ? "is-active" : ""}`} onClick={onClick}>
      <div className="thumb">
        <MiniMap path={course.path} color={course.color}/>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 5 }}>
              {course.tags.slice(0, 2).map(tag => (
                <span key={tag.text} className={`chip-tag ${tag.color}`}>
                  <span>#{tag.text}</span>
                  <span style={{ fontSize: 10 }}>{tag.emoji}</span>
                </span>
              ))}
            </div>
            <h3 style={{ margin: 0, color: "var(--text-1)", fontSize: 15.5, fontWeight: 700,
                         letterSpacing: "-0.015em", lineHeight: 1.3, overflow: "hidden",
                         textOverflow: "ellipsis", display: "-webkit-box",
                         WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
              {course.title}
            </h3>
          </div>
          <button type="button" className={`smile ${isSaved ? "is-on" : ""}`}
            style={{ display: onToggleSave ? undefined : "none" }}
            onClick={e => { e.stopPropagation(); onToggleSave?.(course.id); }}
            aria-label={isSaved ? "즐겨찾기 해제" : "즐겨찾기 추가"}>
            <SmileFavorite on={isSaved}/>
          </button>
          {onEdit && course.mine && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onEdit(); }}
              aria-label="코스 수정"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 999, border: "none",
                background: "transparent", cursor: "pointer",
                color: "var(--text-3)", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
              </svg>
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            {course.distance.toFixed(1)}
            <span style={{ fontSize: 10.5, color: "var(--text-3)", marginLeft: 1, fontWeight: 700 }}>km</span>
          </span>
          <span className="dot-divider"/>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>{course.minutes}분</span>
          {onShare && (
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onShare(); }}
              aria-label="코스 공유"
              style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center",
                       width: 28, height: 28, borderRadius: 999, border: "none",
                       background: "transparent", cursor: "pointer", color: "var(--text-3)",
                       flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── MapView (SVG background) ─────────────────────────────────────────────────
