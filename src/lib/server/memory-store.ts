import type { DduimAppState, UserProfile } from "@/lib/dduim/types";

// ─── 서버 프로세스 내 글로벌 인메모리 스토어 ──────────────────────────────────
// Next.js HMR 환경에서 핫-리로드 시 재생성되지 않도록 globalThis 에 보관
declare global {
  var __dduimMemory: Map<string, DduimAppState> | undefined;
}

const store: Map<string, DduimAppState> = (globalThis.__dduimMemory ??= new Map());

export const STORE_VERSION = 1;
export const COURSE_LIMIT = 10;

function now(): string {
  return new Date().toISOString();
}

export function makeEmptyState(userId: string): DduimAppState {
  const ts = now();
  const profile: UserProfile = {
    id: userId,
    displayName: "이름없는 러너",
    avatarColors: ["#FFE38C", "#FFC9D0"],
    createdAt: ts,
    updatedAt: ts,
  };
  return {
    version: STORE_VERSION,
    currentUser: profile,
    userCourses: [],
    savedCourseIds: [],
    likedPostIds: [],
    updatedAt: ts,
  };
}

export function loadState(userId: string): DduimAppState {
  return store.get(userId) ?? makeEmptyState(userId);
}

export function saveState(userId: string, state: DduimAppState): void {
  store.set(userId, { ...state, updatedAt: now() });
}
