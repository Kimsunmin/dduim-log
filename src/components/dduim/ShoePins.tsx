import type { Course } from "@/lib/dduim/types";
import { COLOR_MID } from "@/lib/dduim/data";

export function ShoePins({ courses, activeId, onPick }: {
  courses: Course[]; activeId: string; onPick: (id: string) => void;
}) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {courses.map(c => {
        const isActive = activeId === c.id;
        const isDim = activeId && !isActive;
        return (
          <button key={c.id}
            className={`shoe-pin ${isActive ? "is-active" : ""}`}
            onClick={() => onPick(c.id)}
            style={{ left: `${c.anchor.x * 100}%`, top: `${c.anchor.y * 100}%`,
                     background: COLOR_MID[c.color], pointerEvents: "auto",
                     opacity: isDim ? 0.45 : 1 }}
            aria-label={`${c.title} 핀`}>
            <span>{c.distance.toFixed(1)}</span>
            <small>km</small>
            {c.mine && (
              <span style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14,
                             borderRadius: 999, background: "var(--text-1)", color: "#fff",
                             fontSize: 8, fontWeight: 800, display: "flex",
                             alignItems: "center", justifyContent: "center",
                             border: "1.5px solid #fff" }}>나</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
