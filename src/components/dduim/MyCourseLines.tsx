import type { Course } from "@/lib/dduim/types";
import { COLOR_INK } from "@/lib/dduim/data";

export function MyCourseLines({ courses, activeId }: { courses: Course[]; activeId: string }) {
  if (!courses.length) return null;
  const toPath = (pts: Course["path"]) => {
    const p = pts.map(pt => ({ x: pt.x * 100, y: pt.y * 100 }));
    if (p.length < 2) return "";
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2;
      d += ` Q ${p[i].x} ${p[i].y} ${mx} ${my}`;
    }
    d += ` T ${p[p.length - 1].x} ${p[p.length - 1].y}`;
    return d;
  };
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
         style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {courses.map(c => {
        const isActive = c.id === activeId;
        const isDim = activeId && !isActive;
        return (
          <g key={c.id} style={{ opacity: isDim ? 0.18 : 1, transition: "opacity 0.25s ease" }}>
            <path d={toPath(c.path)} fill="none" stroke="#fff" vectorEffect="non-scaling-stroke" strokeWidth={isActive ? 8 : 5.5} strokeLinecap="round" strokeLinejoin="round"/>
            <path d={toPath(c.path)} fill="none" stroke={COLOR_INK[c.color]} vectorEffect="non-scaling-stroke" strokeWidth={isActive ? 4 : 2.8} strokeDasharray={isActive ? undefined : "1 4"} strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        );
      })}
    </svg>
  );
}

// ─── ShoePins ─────────────────────────────────────────────────────────────────
