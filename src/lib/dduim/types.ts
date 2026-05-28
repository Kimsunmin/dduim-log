export type TagColor = "mint" | "pink" | "yellow" | "lilac" | "sky" | "peach";
export type SnapPosition = "peek" | "mid" | "full";

export type Course = {
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
  startPoint?: LatLngLiteral;
  geoPath?: LatLngLiteral[];
  tags: Array<{ text: string; emoji: string; color: TagColor }>;
  mine?: boolean;
};

export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type Post = {
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
