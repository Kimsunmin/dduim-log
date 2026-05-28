import { useEffect, useMemo, useRef, useState } from "react";
import type { SnapPosition } from "@/lib/dduim/types";

export function BottomSheet({ children, snap, onSnapChange, peekPx = 96, midPct = 0.52, fullPct = 0.94 }: {
  children: React.ReactNode;
  snap: SnapPosition;
  onSnapChange?: (s: SnapPosition) => void;
  peekPx?: number; midPct?: number; fullPct?: number;
}) {
  const ref     = useRef<HTMLDivElement>(null);
  const drag    = useRef({ active: false, startY: 0, startTop: 0 });
  const [parentH, setParentH] = useState(600);
  const [top, setTop] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const measure = () => {
      const el = ref.current?.parentElement;
      if (el) setParentH(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current?.parentElement) ro.observe(ref.current.parentElement);
    return () => ro.disconnect();
  }, []);

  const snapTops = useMemo(() => ({
    peek: parentH - peekPx,
    mid:  parentH * (1 - midPct),
    full: parentH * (1 - fullPct),
  }), [parentH, peekPx, midPct, fullPct]);
  const currentTop = dragging ? top : (snapTops[snap] ?? snapTops.mid);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest?.('[data-drag-handle]')) return;
    drag.current = { active: true, startY: e.clientY, startTop: currentTop };
    setTop(currentTop);
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const next = Math.max(snapTops.full - 30, Math.min(snapTops.peek + 30,
      drag.current.startTop + (e.clientY - drag.current.startY)));
    setTop(next);
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    const opts: Array<[SnapPosition, number]> = [
      ["peek", snapTops.peek], ["mid", snapTops.mid], ["full", snapTops.full],
    ];
    const best = opts.reduce((a, b) => Math.abs(b[1] - top) < Math.abs(a[1] - top) ? b : a);
    setTop(best[1]);
    onSnapChange?.(best[0]);
  };

  return (
    <div ref={ref} className="sheet"
      style={{ transform: `translateY(${currentTop}px)`, height: parentH,
               transition: dragging ? "none" : "transform 0.32s cubic-bezier(0.32, 0.72, 0.24, 1)" }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <div data-drag-handle="" style={{ paddingTop: 4, cursor: "grab", flexShrink: 0 }}>
        <div className="sheet-handle"/>
      </div>
      {children}
    </div>
  );
}

// ─── CourseCard ───────────────────────────────────────────────────────────────
