import type { ReactNode, CSSProperties } from "react";

function Icon({ children, size = 20, color = "currentColor" }: {
  children: ReactNode; size?: number; color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const IconSearch = (p: { size?: number; color?: string }) => (
  <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></Icon>
);
export const IconChevronDown = (p: { size?: number; color?: string; style?: CSSProperties }) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none"
       stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round"
       strokeLinejoin="round" style={p.style}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
);
export const IconMap = (p: { size?: number; color?: string }) => (
  <Icon {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></Icon>
);
export const IconCompass = (p: { size?: number; color?: string }) => (
  <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></Icon>
);
export const IconPlus = (p: { size?: number; color?: string }) => (
  <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>
);
export const IconBookmark = (p: { size?: number; color?: string }) => (
  <Icon {...p}><path d="M6 4h12v17l-6-4-6 4z"/></Icon>
);
export const IconUser = (p: { size?: number; color?: string }) => (
  <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></Icon>
);
export const IconClock = (p: { size?: number; color?: string }) => (
  <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>
);

// ─── Decorative ───────────────────────────────────────────────────────────────
export function ShoeGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 24" fill="none" aria-hidden="true">
      <path d="M2.2 16.8c0-1 .6-1.5 1.6-1.6l4-.4 3.5-2.4c1-.7 2-1.1 3.2-1.1h4.6c1.6 0 3 .5 4 1.5l3.3 3.2c.7.7 1 1.5 1 2.4 0 1.4-1.1 2.4-2.5 2.4H5.3c-1.7 0-3.1-1.3-3.1-2.9z" fill="#2C2A29"/>
      <path d="M7.6 14.6l3.5-3 1.2-2c.5-.8 1.4-1.3 2.3-1.1l3.8.6c.9.2 1.6 1 1.6 2v2.8" stroke="#2C2A29" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12.4 12.4l1-.6M14 11.6l1.4-.8M15.8 10.9l1.5-.7" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M4 18.4h22" stroke="#fff" strokeWidth="0.9" strokeLinecap="round"/>
    </svg>
  );
}

export function SmileFavorite({ on }: { on: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {on ? (
        <g stroke="#2C2A29" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 10c1-1.2 2.6-1.2 3.6 0" fill="none"/>
          <path d="M13.9 10c1-1.2 2.6-1.2 3.6 0" fill="none"/>
          <path d="M7.8 14.2c1.4 2.2 5 2.4 6.6.4.6-.8 1.4-.7 1.8 0"/>
          <circle cx="6.5" cy="14" r="0.9" fill="#FF9BA6" stroke="none"/>
          <circle cx="17.6" cy="14" r="0.9" fill="#FF9BA6" stroke="none"/>
        </g>
      ) : (
        <g stroke="#8B7F76" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <circle cx="8.5" cy="10.5" r="0.9" fill="#8B7F76" stroke="none"/>
          <circle cx="15.5" cy="10.5" r="0.9" fill="#8B7F76" stroke="none"/>
          <path d="M8 14.4c1.2 1.6 3 2 4.6 1.2.8-.4 1.2-1 1.6-1.2"/>
        </g>
      )}
    </svg>
  );
}

// ─── MiniMap ──────────────────────────────────────────────────────────────────
