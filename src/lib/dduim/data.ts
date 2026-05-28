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
  {
    id: "seoul", name: "서울", dot: "#B6E4D2", lat: 37.5665, lng: 126.9780, level: 9,
    subs: [
      { id: "seoul-songpa",       name: "송파구",  lat: 37.5145, lng: 127.1059, level: 7 },
      { id: "seoul-mapo",         name: "마포구",  lat: 37.5665, lng: 126.9020, level: 7 },
      { id: "seoul-yeongdeungpo", name: "영등포구", lat: 37.5264, lng: 126.8963, level: 7 },
      { id: "seoul-gwangjin",     name: "광진구",  lat: 37.5385, lng: 127.0823, level: 7 },
      { id: "seoul-seocho",       name: "서초구",  lat: 37.4837, lng: 127.0325, level: 7 },
      { id: "seoul-gangnam",      name: "강남구",  lat: 37.5172, lng: 127.0473, level: 7 },
      { id: "seoul-yongsan",      name: "용산구",  lat: 37.5311, lng: 126.9810, level: 7 },
      { id: "seoul-seongdong",    name: "성동구",  lat: 37.5633, lng: 127.0369, level: 7 },
    ],
  },
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
