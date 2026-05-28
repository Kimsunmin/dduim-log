import { useCallback, useEffect, useMemo, useState } from "react";
import type { Course, EntityId, UserProfile } from "./types";
import { FAVORITE_KEY, MINE_KEY } from "./data";

const STORE_KEY = "dduim:store:v1";
const LIKED_POST_KEY = "dduim:liked:v1";
const STORE_VERSION = 1;
const LOCAL_USER_ID = "local-runner";

export type DduimAppState = {
  version: number;
  currentUser: UserProfile;
  userCourses: Course[];
  savedCourseIds: EntityId[];
  likedPostIds: EntityId[];
  updatedAt: string;
};

export type DduimRepository = {
  load(): DduimAppState;
  save(state: DduimAppState): void;
};

const now = () => new Date().toISOString();

const localUser = (timestamp = now()): UserProfile => ({
  id: LOCAL_USER_ID,
  displayName: "이름없는 러너",
  avatarColors: ["#FFE38C", "#FFC9D0"],
  createdAt: timestamp,
  updatedAt: timestamp,
});

const emptyState = (): DduimAppState => {
  const timestamp = now();
  return {
    version: STORE_VERSION,
    currentUser: localUser(timestamp),
    userCourses: [],
    savedCourseIds: [],
    likedPostIds: [],
    updatedAt: timestamp,
  };
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeState(input: Partial<DduimAppState>): DduimAppState {
  const fallback = emptyState();
  const timestamp = input.updatedAt || fallback.updatedAt;

  return {
    version: STORE_VERSION,
    currentUser: {
      ...fallback.currentUser,
      ...input.currentUser,
      id: input.currentUser?.id || LOCAL_USER_ID,
      updatedAt: input.currentUser?.updatedAt || timestamp,
    },
    userCourses: (input.userCourses || []).map(course => ({
      ...course,
      mine: true,
      ownerId: course.ownerId || LOCAL_USER_ID,
      visibility: course.visibility || "private",
      source: course.source || "user",
      createdAt: course.createdAt || timestamp,
      updatedAt: course.updatedAt || timestamp,
      deletedAt: course.deletedAt ?? null,
    })),
    savedCourseIds: Array.from(new Set(input.savedCourseIds || [])),
    likedPostIds: Array.from(new Set(input.likedPostIds || [])),
    updatedAt: timestamp,
  };
}

class LocalDduimRepository implements DduimRepository {
  load(): DduimAppState {
    if (typeof window === "undefined") return emptyState();

    const stored = readJson<Partial<DduimAppState> | null>(STORE_KEY, null);
    if (stored) return normalizeState(stored);

    const migrated = normalizeState({
      userCourses: readJson<Course[]>(MINE_KEY, []),
      savedCourseIds: readJson<EntityId[]>(FAVORITE_KEY, []),
      likedPostIds: readJson<EntityId[]>(LIKED_POST_KEY, []),
    });
    this.save(migrated);
    return migrated;
  }

  save(state: DduimAppState): void {
    if (typeof window === "undefined") return;

    const normalized = normalizeState({ ...state, updatedAt: now() });
    window.localStorage.setItem(STORE_KEY, JSON.stringify(normalized));

    // Keep legacy keys in sync during the prototype phase so old UI state survives refactors.
    window.localStorage.setItem(MINE_KEY, JSON.stringify(normalized.userCourses));
    window.localStorage.setItem(FAVORITE_KEY, JSON.stringify(normalized.savedCourseIds));
    window.localStorage.setItem(LIKED_POST_KEY, JSON.stringify(normalized.likedPostIds));
  }
}

export const dduimRepository: DduimRepository = new LocalDduimRepository();

export function prepareUserCourse(course: Course, userId = LOCAL_USER_ID): Course {
  const timestamp = now();

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

export function useDduimStore(repository: DduimRepository = dduimRepository) {
  const [state, setState] = useState<DduimAppState>(() => emptyState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setState(repository.load());
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [repository]);

  const commit = useCallback((update: (prev: DduimAppState) => DduimAppState) => {
    setState(prev => {
      const next = normalizeState(update(prev));
      repository.save(next);
      return next;
    });
  }, [repository]);

  const actions = useMemo(() => ({
    saveUserCourse(course: Course) {
      commit(prev => ({
        ...prev,
        userCourses: [
          prepareUserCourse(course, prev.currentUser.id),
          ...prev.userCourses.filter(item => item.id !== course.id),
        ],
      }));
    },
    toggleSavedCourse(courseId: EntityId) {
      let saved = false;
      commit(prev => {
        saved = !prev.savedCourseIds.includes(courseId);
        return {
          ...prev,
          savedCourseIds: saved
            ? [...prev.savedCourseIds, courseId]
            : prev.savedCourseIds.filter(id => id !== courseId),
        };
      });
      return saved;
    },
    toggleLikedPost(postId: EntityId) {
      commit(prev => ({
        ...prev,
        likedPostIds: prev.likedPostIds.includes(postId)
          ? prev.likedPostIds.filter(id => id !== postId)
          : [...prev.likedPostIds, postId],
      }));
    },
  }), [commit]);

  return { ...state, ready, actions };
}
