"use client";

import { useCallback, useEffect, useState } from "react";
import type { Course, DduimAppState, EntityId } from "./types";

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const STORE_VERSION = 1;
const UID_KEY = "dduim:uid:v1";

// ─── UID: localStorage 에 UUID 만 보관 ───────────────────────────────────────
function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(UID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(UID_KEY, id);
  }
  return id;
}

// ─── 초기 빈 상태 ─────────────────────────────────────────────────────────────
function makeEmptyState(userId: string): DduimAppState {
  const ts = new Date().toISOString();
  return {
    version: STORE_VERSION,
    currentUser: {
      id: userId,
      displayName: "이름없는 러너",
      avatarColors: ["#FFE38C", "#FFC9D0"],
      createdAt: ts,
      updatedAt: ts,
    },
    userCourses: [],
    savedCourseIds: [],
    likedPostIds: [],
    updatedAt: ts,
  };
}

// ─── 코스 저장 준비 ───────────────────────────────────────────────────────────
export function prepareUserCourse(course: Course, userId: string): Course {
  const timestamp = new Date().toISOString();
  return {
    ...course,
    mine: true,
    ownerId: userId,
    visibility: course.visibility || "private",
    source: "user",
    createdAt: course.createdAt || timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDduimStore() {
  // UID는 컴포넌트 생명주기 동안 불변
  const [uid] = useState<string>(() => getOrCreateUserId());

  const [state, setState] = useState<DduimAppState>(() => makeEmptyState(uid));
  const [ready, setReady] = useState(false);

  // 최초 마운트: 서버에서 상태 로드
  useEffect(() => {
    fetch(`/api/state?uid=${encodeURIComponent(uid)}`)
      .then(r => r.json() as Promise<DduimAppState>)
      .then(s => { setState(s); setReady(true); })
      .catch(() => { setState(makeEmptyState(uid)); setReady(true); });
  }, [uid]);

  // 서버 동기화 (fire-and-forget)
  const syncToServer = useCallback((next: DduimAppState) => {
    fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, state: next }),
    }).catch(() => {});
  }, [uid]);

  // 낙관적 업데이트 + 비동기 서버 저장
  const commit = useCallback((update: (prev: DduimAppState) => DduimAppState) => {
    setState(prev => {
      const next = { ...update(prev), updatedAt: new Date().toISOString() };
      syncToServer(next);
      return next;
    });
  }, [syncToServer]);

  const actions = {
    // 코스 생성: 서버에서 10개 제한 검사
    async saveUserCourse(course: Course): Promise<{ limitReached?: boolean }> {
      const prepared = prepareUserCourse(course, uid);
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, course: prepared }),
      });
      if (res.status === 429) return { limitReached: true };
      const newState = (await res.json()) as DduimAppState;
      setState(newState);
      return {};
    },

    // 즐겨찾기 토글 (낙관적 업데이트)
    toggleSavedCourse(courseId: EntityId): boolean {
      const isSaved = !state.savedCourseIds.includes(courseId);
      commit(prev => ({
        ...prev,
        savedCourseIds: isSaved
          ? [...prev.savedCourseIds, courseId]
          : prev.savedCourseIds.filter(id => id !== courseId),
      }));
      return isSaved;
    },

    // 닉네임 변경
    async updateDisplayName(name: string): Promise<void> {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, displayName: name }),
      });
      const newState = (await res.json()) as DduimAppState;
      setState(newState);
    },
  };

  return { ...state, uid, ready, actions };
}
