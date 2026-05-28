import type { Course } from "@/lib/dduim/types";
import { COLOR_INK } from "@/lib/dduim/data";

export function MapView({ courses, activeId }: { courses: Course[]; activeId: string }) {
  const pathStr = (c: Course) => {
    const cx = c.anchor.x * 1000, cy = c.anchor.y * 900;
    return c.path.map(p => `${cx + (p.x - 0.5) * 280},${cy + (p.y - 0.5) * 280}`).join(" ");
  };
  return (
    <svg className="map-svg" viewBox="0 0 1000 900" preserveAspectRatio="xMidYMid slice">
      <rect width="1000" height="900" fill="#F5F1E8"/>
      <g fill="#E5DECE">
        {Array.from({ length: 12 }).flatMap((_, r) =>
          Array.from({ length: 13 }).map((__, c) => (
            <circle key={`${r}-${c}`} cx={c * 80 + 20} cy={r * 80 + 40} r="1.4"/>
          ))
        )}
      </g>
      <path d="M620 200 q60 -30 130 -10 q60 18 70 60 q10 50 -30 80 q-80 36 -140 10 q-70 -30 -50 -90 z" fill="#E1EBCE" opacity="0.85"/>
      <circle cx="160" cy="220" r="50" fill="#E1EBCE" opacity="0.7"/>
      <path d="M-20 540 C120 460 260 600 420 520 C580 440 740 600 900 520 C980 480 1040 500 1060 520 L1060 600 C980 640 900 600 820 620 C700 660 580 580 420 620 C260 660 120 560 -20 640 Z" fill="#D8E8E2" opacity="0.9"/>
      {courses.map(c => {
        const isActive = c.id === activeId;
        const isDim = activeId && !isActive;
        return (
          <g key={c.id} className="route-line" style={{ opacity: isDim ? 0.18 : 1 }}>
            <polyline points={pathStr(c)} fill="none" stroke="#fff" strokeWidth={isActive ? 14 : 9} strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points={pathStr(c)} fill="none" stroke={COLOR_INK[c.color]} strokeWidth={isActive ? 6 : 3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={isActive ? undefined : "1 5"}/>
          </g>
        );
      })}
    </svg>
  );
}

// ─── MyCourseLines ────────────────────────────────────────────────────────────
