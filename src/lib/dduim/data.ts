import type { Course, Post, TagColor } from "./types";

export const COLOR_INK: Record<TagColor, string> = {
  mint: "#2F8B6E", pink: "#C04C5A", yellow: "#B07A00",
  lilac: "#6647B0", sky: "#2E6CA1", peach: "#B05A2E",
};
export const COLOR_BG: Record<TagColor, string> = {
  mint: "#DBF1E9", pink: "#FFE3E6", yellow: "#FFF3CC",
  lilac: "#ECE4FA", sky: "#DCEEFB", peach: "#FFE6D6",
};
export const COLOR_MID: Record<TagColor, string> = {
  mint: "#B6E4D2", pink: "#FFC9D0", yellow: "#FFE38C",
  lilac: "#D6C7F5", sky: "#B7DAF5", peach: "#FFC8A8",
};

// ─── Static Data ─────────────────────────────────────────────────────────────
export const FAVORITE_KEY = "dduim:favorites:v1";
export const MINE_KEY = "dduim:mine:v1";

export const AREAS = [
  { id: "yeouido",     name: "여의도",       sub: "한강공원 근처",        count: 12, dot: "#B6E4D2" },
  { id: "hangang",     name: "한강 전 구간", sub: "여의도 · 반포 · 망원", count: 28, dot: "#B7DAF5" },
  { id: "namsan",      name: "남산",         sub: "둘레길 · 케이블카",    count: 9,  dot: "#FFC8A8" },
  { id: "yangjae",     name: "양재천",       sub: "벚꽃 · 평지",          count: 6,  dot: "#FFC9D0" },
  { id: "seokchon",    name: "석촌호수",     sub: "송파 · 두 바퀴",       count: 5,  dot: "#D6C7F5" },
  { id: "seoulforest", name: "서울숲",       sub: "성수동 · 사슴길",      count: 4,  dot: "#DBF1E9" },
];

export const PACE_PRESETS = [
  { id: "walk", label: "산책",   pace: 8.0, emoji: "🚶" },
  { id: "jog",  label: "조깅",   pace: 6.0, emoji: "🐢" },
  { id: "run",  label: "달리기", pace: 5.0, emoji: "🏃" },
  { id: "fast", label: "빠르게", pace: 4.5, emoji: "⚡" },
] as const;

export const TAG_CATALOG: Array<{ text: string; emoji: string; color: TagColor }> = [
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

export const POSTS: Post[] = [
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

export const baseCourses: Course[] = [
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

export const FILTER_OPTIONS = ["전체", "한강뷰", "초보환영", "신호등없음", "야간추천"];

export const navItems = [
  { id: "home",  label: "탐색" },
  { id: "feed",  label: "피드" },
  { id: "saves", label: "저장" },
  { id: "me",    label: "나"   },
] as const;
export type TabId = (typeof navItems)[number]["id"];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
