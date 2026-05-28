import type { Course, TagColor } from "@/lib/dduim/types";
import { COLOR_BG, COLOR_INK } from "@/lib/dduim/data";

export function MiniMap({ path, color = "mint" as TagColor, large = false }: {
  path: Course["path"]; color?: TagColor; large?: boolean;
}) {
  const ink = COLOR_INK[color] || "#2F8B6E";
  const bg  = COLOR_BG[color]  || "#DBF1E9";

  const xs   = path.map(p => p.x), ys = path.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(0.0001, maxX - minX);
  const spanY = Math.max(0.0001, maxY - minY);
  const span  = Math.max(spanX, spanY);
  const pad   = 0.16;
  const norm  = (pt: { x: number; y: number }) => ({
    x: pad + ((pt.x - minX) / span + (span - spanX) / (2 * span)) * (1 - 2 * pad),
    y: pad + ((pt.y - minY) / span + (span - spanY) / (2 * span)) * (1 - 2 * pad),
  });
  const np    = path.map(norm);
  const pts   = np.map(p => `${p.x * 100},${p.y * 100}`).join(" ");
  const start = np[0];
  const end   = np[np.length - 1];

  return (
    <div className={`mini-map${large ? " large" : ""}`}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <rect width="100" height="100" fill={bg}/>
        <g fill="#fff" opacity="0.55">
          {[25, 50, 75].flatMap(y => [25, 50, 75].map(x => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8"/>
          )))}
        </g>
        <polyline points={pts} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points={pts} fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
        <circle cx={start.x * 100} cy={start.y * 100} r="3.4" fill="#fff" stroke={ink} strokeWidth="1.6"/>
        <circle cx={end.x * 100} cy={end.y * 100} r="2.4" fill={ink}/>
      </svg>
    </div>
  );
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────
