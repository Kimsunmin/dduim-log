"use client";

import { useMemo, useRef, useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type TagColor = "mint" | "pink" | "yellow" | "lilac" | "sky" | "peach";
type SnapPosition = "peek" | "mid" | "full";

type Course = {
  id: string;
  title: string;
  area: string;
  distance: number;
  minutes: number;
  elevation: number;
  color: TagColor;
  author: string;
  saves: number;
  anchor: { x: number; y: number };
  path: Array<{ x: number; y: number }>;
  tags: Array<{ text: string; emoji: string; color: TagColor }>;
  mine?: boolean;
};

type Post = {
  id: string;
  courseId: string;
  author: { name: string; avatar: [string, string] };
  timeAgo: string;
  record: { km: number; totalSec: number; paceMin: number; paceSec: number };
  caption: string;
  likes: number;
  isLiked: boolean;
  comments: Array<{ who: string; text: string }>;
};

// ─── Color Maps ───────────────────────────────────────────────────────────────
const COLOR_INK: Record<TagColor, string> = {
  mint: "#2F8B6E", pink: "#C04C5A", yellow: "#B07A00",
  lilac: "#6647B0", sky: "#2E6CA1", peach: "#B05A2E",
};
const COLOR_BG: Record<TagColor, string> = {
  mint: "#DBF1E9", pink: "#FFE3E6", yellow: "#FFF3CC",
  lilac: "#ECE4FA", sky: "#DCEEFB", peach: "#FFE6D6",
};
const COLOR_MID: Record<TagColor, string> = {
  mint: "#B6E4D2", pink: "#FFC9D0", yellow: "#FFE38C",
  lilac: "#D6C7F5", sky: "#B7DAF5", peach: "#FFC8A8",
};

// ─── Static Data ─────────────────────────────────────────────────────────────
const FAVORITE_KEY = "dduim:favorites:v1";
const MINE_KEY = "dduim:mine:v1";

const AREAS = [
  { id: "yeouido",     name: "여의도",       sub: "한강공원 근처",        count: 12, dot: "#B6E4D2" },
  { id: "hangang",     name: "한강 전 구간", sub: "여의도 · 반포 · 망원", count: 28, dot: "#B7DAF5" },
  { id: "namsan",      name: "남산",         sub: "둘레길 · 케이블카",    count: 9,  dot: "#FFC8A8" },
  { id: "yangjae",     name: "양재천",       sub: "벚꽃 · 평지",          count: 6,  dot: "#FFC9D0" },
  { id: "seokchon",    name: "석촌호수",     sub: "송파 · 두 바퀴",       count: 5,  dot: "#D6C7F5" },
  { id: "seoulforest", name: "서울숲",       sub: "성수동 · 사슴길",      count: 4,  dot: "#DBF1E9" },
];

const PACE_PRESETS = [
  { id: "walk", label: "산책",   pace: 8.0, emoji: "🚶" },
  { id: "jog",  label: "조깅",   pace: 6.0, emoji: "🐢" },
  { id: "run",  label: "달리기", pace: 5.0, emoji: "🏃" },
  { id: "fast", label: "빠르게", pace: 4.5, emoji: "⚡" },
] as const;

const TAG_CATALOG: Array<{ text: string; emoji: string; color: TagColor }> = [
  { text: "한강뷰",     emoji: "🌊", color: "sky"    },
  { text: "신호등없음", emoji: "🚦", color: "mint"   },
  { text: "야간추천",   emoji: "🌙", color: "lilac"  },
  { text: "초보환영",   emoji: "🐣", color: "yellow" },
  { text: "언덕있음",   emoji: "⛰️", color: "peach"  },
  { text: "벚꽃",       emoji: "🌸", color: "pink"   },
  { text: "공원",       emoji: "🦌", color: "mint"   },
  { text: "호수뷰",     emoji: "💧", color: "sky"    },
  { text: "인터벌",     emoji: "⚡", color: "yellow" },
];

const POSTS: Post[] = [
  {
    id: "p1", courseId: "c-hangang-night",
    author: { name: "달리는해달", avatar: ["#FFE38C", "#FFC9D0"] },
    timeAgo: "2시간 전",
    record: { km: 5.24, totalSec: 28 * 60 + 12, paceMin: 5, paceSec: 23 },
    caption: "퇴근 후 한강 야경 5K. 다리 위 진짜 명당. 호흡 처음으로 끝까지 안 끊겼다 🥹",
    likes: 142, isLiked: false,
    comments: [
      { who: "성수동느림보", text: "와 다리 위가 진짜 명당이에요 🥺" },
      { who: "벚꽃엔딩", text: "내일 저도 가볼래요!" },
    ],
  },
  {
    id: "p2", courseId: "c-namsan-loop",
    author: { name: "산타클로스러너", avatar: ["#B6E4D2", "#B7DAF5"] },
    timeAgo: "5시간 전",
    record: { km: 7.42, totalSec: 48 * 60 + 56, paceMin: 6, paceSec: 35 },
    caption: "오르막 두 번 끊지 않고 완주! 봄이 와서 그런가 둘레길 사람이 많아졌어요.",
    likes: 89, isLiked: false,
    comments: [{ who: "송파토끼", text: "고고 🏃‍♂️ 다음엔 같이 가요" }],
  },
  {
    id: "p3", courseId: "c-yangjae",
    author: { name: "벚꽃엔딩", avatar: ["#FFC9D0", "#D6C7F5"] },
    timeAgo: "어제",
    record: { km: 3.11, totalSec: 19 * 60 + 4, paceMin: 6, paceSec: 8 },
    caption: "벚꽃 80%. 다음 주가 절정일 것 같아요. 사진 못참고 8번 멈췄음 ㅎㅎ",
    likes: 304, isLiked: true,
    comments: [
      { who: "달리는해달", text: "사진 좀 더 올려주세요 🌸🌸" },
      { who: "성수동느림보", text: "벚꽃 보러 가야지~" },
    ],
  },
  {
    id: "p4", courseId: "c-seokchon",
    author: { name: "송파토끼", avatar: ["#FFE38C", "#B6E4D2"] },
    timeAgo: "이틀 전",
    record: { km: 5.03, totalSec: 25 * 60 + 41, paceMin: 5, paceSec: 6 },
    caption: "호수 두 바퀴 인터벌. 마지막 200m 풀스피드. 신호등 0개라 진짜 최고.",
    likes: 56, isLiked: false,
    comments: [],
  },
];

const baseCourses: Course[] = [
  {
    id: "c-hangang-night",
    title: "여의도 한강 야경 코스",
    area: "여의도",
    distance: 5.2,
    minutes: 32,
    elevation: 4,
    color: "mint",
    author: "브릿지러너",
    saves: 1284,
    anchor: { x: 0.31, y: 0.55 },
    tags: [
      { text: "한강뷰", emoji: "🌊", color: "sky" },
      { text: "신호등없음", emoji: "🚦", color: "mint" },
      { text: "야간추천", emoji: "🌙", color: "lilac" },
    ],
    path: [
      { x: 0.1, y: 0.78 }, { x: 0.18, y: 0.62 }, { x: 0.3, y: 0.5 },
      { x: 0.45, y: 0.45 }, { x: 0.62, y: 0.4 }, { x: 0.78, y: 0.3 },
      { x: 0.86, y: 0.22 }, { x: 0.84, y: 0.1 }, { x: 0.55, y: 0.2 },
      { x: 0.26, y: 0.5 }, { x: 0.1, y: 0.86 },
    ],
  },
  {
    id: "c-namsan-loop",
    title: "남산 둘레길 한 바퀴",
    area: "남산",
    distance: 7.4,
    minutes: 52,
    elevation: 86,
    color: "pink",
    author: "고개러버",
    saves: 892,
    anchor: { x: 0.62, y: 0.32 },
    tags: [
      { text: "둘레길", emoji: "🌿", color: "mint" },
      { text: "언덕있음", emoji: "⛰️", color: "peach" },
      { text: "주말추천", emoji: "☀️", color: "pink" },
    ],
    path: [
      { x: 0.2, y: 0.5 }, { x: 0.32, y: 0.32 }, { x: 0.5, y: 0.2 },
      { x: 0.68, y: 0.18 }, { x: 0.82, y: 0.28 }, { x: 0.88, y: 0.45 },
      { x: 0.84, y: 0.62 }, { x: 0.72, y: 0.78 }, { x: 0.54, y: 0.84 },
      { x: 0.36, y: 0.8 }, { x: 0.2, y: 0.5 },
    ],
  },
  {
    id: "c-yangjae",
    title: "양재천 벚꽃 조깅로",
    area: "양재천",
    distance: 3.1,
    minutes: 19,
    elevation: 2,
    color: "yellow",
    author: "벚꽃러닝",
    saves: 2103,
    anchor: { x: 0.74, y: 0.68 },
    tags: [
      { text: "벚꽃", emoji: "🌸", color: "pink" },
      { text: "초보환영", emoji: "🙂", color: "yellow" },
      { text: "평지", emoji: "🛣️", color: "mint" },
    ],
    path: [
      { x: 0.12, y: 0.7 }, { x: 0.26, y: 0.62 }, { x: 0.42, y: 0.56 },
      { x: 0.58, y: 0.5 }, { x: 0.72, y: 0.42 }, { x: 0.84, y: 0.3 },
      { x: 0.9, y: 0.2 },
    ],
  },
  {
    id: "c-seokchon",
    title: "석촌호수 두 바퀴 인터벌",
    area: "석촌호수",
    distance: 5,
    minutes: 28,
    elevation: 6,
    color: "sky",
    author: "호수페이서",
    saves: 562,
    anchor: { x: 0.85, y: 0.5 },
    tags: [
      { text: "호수뷰", emoji: "💧", color: "sky" },
      { text: "인터벌", emoji: "⚡", color: "yellow" },
      { text: "신호등없음", emoji: "🚦", color: "mint" },
    ],
    path: [
      { x: 0.3, y: 0.5 }, { x: 0.4, y: 0.3 }, { x: 0.6, y: 0.24 },
      { x: 0.8, y: 0.34 }, { x: 0.86, y: 0.54 }, { x: 0.78, y: 0.74 },
      { x: 0.58, y: 0.82 }, { x: 0.36, y: 0.74 }, { x: 0.24, y: 0.56 },
      { x: 0.3, y: 0.5 },
    ],
  },
];

const FILTER_OPTIONS = ["전체", "한강뷰", "초보환영", "신호등없음", "야간추천"];

const navItems = [
  { id: "home",  label: "탐색" },
  { id: "feed",  label: "피드" },
  { id: "saves", label: "저장" },
  { id: "me",    label: "나"   },
] as const;
type TabId = (typeof navItems)[number]["id"];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function Icon({ children, size = 20, color = "currentColor" }: {
  children: React.ReactNode; size?: number; color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const IconSearch = (p: { size?: number; color?: string }) => (
  <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></Icon>
);
const IconChevronDown = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none"
       stroke={p.color ?? "currentColor"} strokeWidth="1.8" strokeLinecap="round"
       strokeLinejoin="round" style={p.style}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
);
const IconMap = (p: { size?: number; color?: string }) => (
  <Icon {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></Icon>
);
const IconCompass = (p: { size?: number; color?: string }) => (
  <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></Icon>
);
const IconPlus = (p: { size?: number; color?: string }) => (
  <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>
);
const IconBookmark = (p: { size?: number; color?: string }) => (
  <Icon {...p}><path d="M6 4h12v17l-6-4-6 4z"/></Icon>
);
const IconUser = (p: { size?: number; color?: string }) => (
  <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></Icon>
);
const IconClock = (p: { size?: number; color?: string }) => (
  <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>
);

// ─── Decorative ───────────────────────────────────────────────────────────────
function ShoeGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 24" fill="none" aria-hidden="true">
      <path d="M2.2 16.8c0-1 .6-1.5 1.6-1.6l4-.4 3.5-2.4c1-.7 2-1.1 3.2-1.1h4.6c1.6 0 3 .5 4 1.5l3.3 3.2c.7.7 1 1.5 1 2.4 0 1.4-1.1 2.4-2.5 2.4H5.3c-1.7 0-3.1-1.3-3.1-2.9z" fill="#2C2A29"/>
      <path d="M7.6 14.6l3.5-3 1.2-2c.5-.8 1.4-1.3 2.3-1.1l3.8.6c.9.2 1.6 1 1.6 2v2.8" stroke="#2C2A29" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12.4 12.4l1-.6M14 11.6l1.4-.8M15.8 10.9l1.5-.7" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M4 18.4h22" stroke="#fff" strokeWidth="0.9" strokeLinecap="round"/>
    </svg>
  );
}

function SmileFavorite({ on }: { on: boolean }) {
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
function MiniMap({ path, color = "mint" as TagColor, large = false }: {
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
function BottomSheet({ children, snap, onSnapChange, peekPx = 96, midPct = 0.52, fullPct = 0.94 }: {
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
function CourseCard({ course, isActive, isSaved, onClick, onToggleSave }: {
  course: Course; isActive: boolean; isSaved: boolean;
  onClick: () => void; onToggleSave: (id: string) => void;
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
          <button className={`smile ${isSaved ? "is-on" : ""}`}
            onClick={e => { e.stopPropagation(); onToggleSave(course.id); }}
            aria-label={isSaved ? "즐겨찾기 해제" : "즐겨찾기 추가"}>
            <SmileFavorite on={isSaved}/>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            {course.distance.toFixed(1)}
            <span style={{ fontSize: 10.5, color: "var(--text-3)", marginLeft: 1, fontWeight: 700 }}>km</span>
          </span>
          <span className="dot-divider"/>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>{course.minutes}분</span>
        </div>
      </div>
    </article>
  );
}

// ─── MapView (SVG background) ─────────────────────────────────────────────────
function MapView({ courses, activeId }: { courses: Course[]; activeId: string }) {
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
function MyCourseLines({ courses, activeId }: { courses: Course[]; activeId: string }) {
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
function ShoePins({ courses, activeId, onPick }: {
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
        <MapView courses={courses.filter(c => !c.mine)} activeId={activeId}/>
        <MyCourseLines courses={courses.filter(c => c.mine)} activeId={activeId}/>
        <ShoePins courses={visibleCourses} activeId={activeId}
          onPick={id => { setActiveId(id); setSnap("peek"); }}/>
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

// ─── DrawingMode ──────────────────────────────────────────────────────────────
function DrawingMode({ onExit, onSave }: {
  onExit: () => void; onSave: (course: Course) => void;
}) {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [paceId, setPaceId] = useState<"walk" | "jog" | "run" | "fast">("jog");
  const [stage, setStage] = useState<"draw" | "details">("draw");
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aspect, setAspect] = useState(1.0);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      const el = canvasRef.current;
      if (el) setAspect(el.clientHeight / Math.max(1, el.clientWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const pace = PACE_PRESETS.find(p => p.id === paceId) || PACE_PRESETS[1];
  const km = calcDistance(points, aspect);
  const minsRounded = Math.max(1, Math.round(km * pace.pace));
  const canSave = points.length >= 2 && km > 0.05;

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setPoints(prev => [...prev, { x, y }]);
  };

  const smoothD = smoothedPath(points);

  const handleSave = () => {
    const tagObjs = selectedTags
      .map(t => TAG_CATALOG.find(c => c.text === t))
      .filter((t): t is (typeof TAG_CATALOG)[number] => Boolean(t));
    onSave({
      id: createCourseId(title, points, km),
      title: title.trim() || "이름 없는 코스",
      area: "내 코스",
      distance: +km.toFixed(1),
      minutes: minsRounded,
      elevation: Math.round(km * 3),
      color: tagObjs[0]?.color || "mint",
      author: "나",
      saves: 0,
      anchor: points[0],
      path: points,
      tags: tagObjs.length ? tagObjs : [{ text: "내코스", emoji: "🎒", color: "mint" }],
      mine: true,
    });
  };

  return (
    <section className="drawing">
      <div className="drawing-top">
        <button className="icon-btn" onClick={onExit} aria-label="닫기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C2A29"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div>
          <h1>{stage === "draw" ? "코스 그리기" : "코스 정보"}</h1>
          <p>
            {stage === "draw"
              ? (points.length === 0 ? "지도를 탭해 시작점을 찍어주세요 👇" : `${points.length}개 지점 · 탭해서 이어가기`)
              : "코스 이름과 태그를 정해주세요"}
          </p>
        </div>
        {stage === "draw" && points.length > 0 && (
          <button className="icon-btn" onClick={() => setPoints(p => p.slice(0, -1))} aria-label="되돌리기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C2A29"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14l-4-4 4-4"/><path d="M5 10h9a5 5 0 1 1 0 10h-2"/>
            </svg>
          </button>
        )}
      </div>

      {stage === "draw" && (
        <>
          <div ref={canvasRef} className="draw-map" onClick={onCanvasClick}>
            <MapView courses={[]} activeId=""/>
            {points.length >= 1 && (
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100"
                   style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <path d={smoothD} fill="none" stroke="#fff" strokeWidth="2.4"
                      strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}/>
                <path d={smoothD} fill="none" stroke="var(--mint-deep)" strokeWidth="1.4"
                      strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                      style={{ strokeWidth: "5px" }}/>
              </svg>
            )}
            {points.map((p, i) => {
              const isStart = i === 0;
              const isEnd = i === points.length - 1 && points.length > 1;
              return (
                <div key={i} style={{ position: "absolute", left: `${p.x * 100}%`, top: `${p.y * 100}%`,
                                      transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
                  {isStart ? (
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--mint-deep)",
                                  border: "3px solid #fff", display: "flex", alignItems: "center",
                                  justifyContent: "center", boxShadow: "var(--shadow-pin)",
                                  color: "#fff", fontWeight: 800, fontSize: 11 }}>S</div>
                  ) : isEnd ? (
                    <div style={{ width: 22, height: 22, borderRadius: 999, background: "#fff",
                                  border: "3px solid var(--mint-deep)", boxShadow: "var(--shadow-pin)" }}/>
                  ) : (
                    <div style={{ width: 10, height: 10, borderRadius: 999, background: "#fff",
                                  border: "2px solid var(--mint-deep)",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.18)" }}/>
                  )}
                </div>
              );
            })}
            {points.length === 0 && (
              <div className="draw-hint">👆 탭해서 시작점 찍기</div>
            )}
          </div>

          <div className="draw-dock">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--text-1)",
                            letterSpacing: "-0.03em", lineHeight: 1 }}>
                {km.toFixed(2)}
                <span style={{ fontSize: 14, color: "var(--text-3)", marginLeft: 4, fontWeight: 700 }}>km</span>
              </div>
              <div style={{ marginTop: 4, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                <IconClock size={13}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                  {minsRounded >= 60 ? `${Math.floor(minsRounded / 60)}시간 ${minsRounded % 60}분` : `${minsRounded}분`}
                </span>
                <span className="dot-divider"/>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>{points.length}개 지점</span>
              </div>
            </div>
            {points.length > 0 && (
              <button onClick={() => setPoints([])} style={{
                height: 36, padding: "0 14px", borderRadius: 999, background: "transparent",
                border: "1px solid var(--border-warm)", cursor: "pointer",
                color: "var(--text-2)", fontWeight: 700, fontSize: 12.5, fontFamily: "inherit",
              }}>초기화</button>
            )}
          </div>

          <div style={{ padding: "0 16px 14px", background: "var(--bg-card)" }}>
            <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12 }}>
              {PACE_PRESETS.map(p => (
                <button key={p.id} onClick={() => setPaceId(p.id as typeof paceId)} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  height: 34, padding: "0 14px", borderRadius: 999, cursor: "pointer",
                  background: paceId === p.id ? "var(--text-1)" : "var(--bg-soft)",
                  border: paceId === p.id ? "1px solid var(--text-1)" : "1px solid var(--border-warm)",
                  color: paceId === p.id ? "var(--bg-cream)" : "var(--text-2)",
                  fontWeight: 700, fontSize: 12.5, fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                  <span style={{ opacity: 0.6, fontSize: 11 }}>{p.pace.toFixed(1).replace(".", "'")}″</span>
                </button>
              ))}
            </div>
            <button onClick={() => canSave && setStage("details")} disabled={!canSave} style={{
              width: "100%", height: 52, borderRadius: 18,
              background: canSave ? "var(--mint-deep)" : "var(--border-warm)",
              color: canSave ? "#fff" : "var(--text-4)",
              border: "none", cursor: canSave ? "pointer" : "not-allowed",
              fontWeight: 800, fontSize: 15, fontFamily: "inherit", letterSpacing: "-0.01em",
              boxShadow: canSave ? "0 6px 16px -6px rgba(47, 139, 110, 0.5)" : "none",
            }}>
              {canSave ? "다음" : "2개 이상 점을 찍어주세요"}
            </button>
          </div>
        </>
      )}

      {stage === "details" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 100px" }}>
            <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: 16,
                          border: "1px solid var(--border-warm)", boxShadow: "var(--shadow-card)",
                          display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: 18, background: "var(--mint-soft)",
                            position: "relative", overflow: "hidden" }}>
                <svg width="96" height="96" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d={smoothD} fill="none" stroke="var(--mint-deep)" strokeWidth="4"
                        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
                  {km.toFixed(2)}<span style={{ fontSize: 14, color: "var(--text-3)", marginLeft: 4 }}>km</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "var(--text-3)" }}>
                  <IconClock size={13}/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                    {Math.floor(minsRounded / 60) > 0 ? `${Math.floor(minsRounded / 60)}시간 ` : ""}{minsRounded % 60}분
                  </span>
                  <span className="dot-divider"/>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>{pace.label} 페이스</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                코스 이름
              </label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="예) 여의도 한강 야경 5km" maxLength={28} style={{
                  width: "100%", height: 48, padding: "0 16px", borderRadius: 16,
                  border: "1px solid var(--border-warm)", background: "var(--bg-card)",
                  fontSize: 15, fontWeight: 600, color: "var(--text-1)",
                  fontFamily: "inherit", outline: "none", boxShadow: "var(--shadow-soft)",
                }}/>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
                태그 <span style={{ color: "var(--text-4)", fontWeight: 500 }}>· 최대 4개 ({selectedTags.length}/4)</span>
              </label>
              <div className="tag-picker">
                {TAG_CATALOG.map(t => {
                  const on = selectedTags.includes(t.text);
                  return (
                    <button key={t.text} onClick={() =>
                      setSelectedTags(prev =>
                        prev.includes(t.text) ? prev.filter(x => x !== t.text)
                          : prev.length < 4 ? [...prev, t.text] : prev
                      )} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      height: 32, padding: "0 12px", borderRadius: 999, cursor: "pointer",
                      background: on ? `var(--${t.color}-soft)` : "var(--bg-card)",
                      border: on ? "1.5px solid var(--mint-deep)" : "1px solid var(--border-warm)",
                      color: "var(--text-1)", fontWeight: 700, fontSize: 12.5,
                      fontFamily: "inherit", transition: "all 0.15s ease",
                    }}>
                      <span>#{t.text}</span>
                      <span style={{ fontSize: 11 }}>{t.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 14, borderRadius: 16,
                          background: "var(--yellow-soft)", color: "var(--yellow-ink)",
                          fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>
              🍀 로그인 없이 내 브라우저에 저장돼요. 나중에 공유 링크로 친구들한테 보낼 수 있어요.
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0,
                        background: "var(--bg-card)", borderTop: "1px solid var(--border-warm)",
                        padding: "12px 16px", display: "flex", gap: 8,
                        boxShadow: "0 -8px 24px -12px rgba(120, 90, 60, 0.18)" }}>
            <button onClick={() => setStage("draw")} style={{
              height: 52, padding: "0 18px", borderRadius: 18, background: "var(--bg-soft)",
              border: "1px solid var(--border-warm)", cursor: "pointer",
              color: "var(--text-2)", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
            }}>이전</button>
            <button onClick={handleSave} style={{
              flex: 1, height: 52, borderRadius: 18, background: "var(--mint-deep)",
              color: "#fff", border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: 15, fontFamily: "inherit", letterSpacing: "-0.01em",
              boxShadow: "0 6px 16px -6px rgba(47, 139, 110, 0.5)",
            }}>저장하고 공유하기</button>
          </div>
        </>
      )}
    </section>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; }
  catch { return fallback; }
}

function smoothedPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  const p = points.map(pt => ({ x: pt.x * 100, y: pt.y * 100 }));
  if (p.length === 1) return `M ${p[0].x} ${p[0].y}`;
  if (p.length === 2) return `M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y}`;
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2;
    d += ` Q ${p[i].x} ${p[i].y} ${mx} ${my}`;
  }
  d += ` T ${p[p.length - 1].x} ${p[p.length - 1].y}`;
  return d;
}

function calcDistance(points: Array<{ x: number; y: number }>, aspect = 1.0): number {
  if (points.length < 2) return 0;
  const span = 2400;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = (points[i].x - points[i - 1].x) * span;
    const dy = (points[i].y - points[i - 1].y) * span * aspect;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total / 1000;
}

function createCourseId(title: string, points: Array<{ x: number; y: number }>, distance: number): string {
  const slug = (title.trim() || "course").replace(/[^\w가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 18);
  const shape = points.slice(0, 4).map(p => `${Math.round(p.x * 100)}${Math.round(p.y * 100)}`).join("-");
  return `mine-${slug}-${Math.round(distance * 1000)}-${shape}`;
}
