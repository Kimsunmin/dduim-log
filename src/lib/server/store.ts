import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, likedPosts, savedCourses, users } from "@/lib/db/schema";
import type { Course, DduimAppState, UserProfile } from "@/lib/dduim/types";

export const COURSE_LIMIT = 10;

// ─── 내부 매핑 ────────────────────────────────────────────────────────────────

type UserRow = typeof users.$inferSelect;
type CourseRow = typeof courses.$inferSelect;

function toUserProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    displayName: row.displayName,
    avatarColors: row.avatarColors,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    area: row.area,
    distance: row.distance,
    minutes: row.minutes,
    elevation: row.elevation,
    color: row.color,
    author: row.author,
    saves: row.saves,
    anchor: row.anchor,
    path: row.path,
    startPoint: row.startPoint ?? undefined,
    geoPath: row.geoPath ?? undefined,
    tags: row.tags,
    mine: true,
    ownerId: row.ownerId,
    visibility: row.visibility,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────

/**
 * 없으면 기본값으로 생성, 있으면 그대로 반환 (loadState 내부에서 호출)
 */
async function getOrCreateUser(userId: string): Promise<UserProfile> {
  await db
    .insert(users)
    .values({
      id: userId,
      avatarColors: ["#FFE38C", "#FFC9D0"],
    })
    .onConflictDoNothing();

  const [row] = await db.select().from(users).where(eq(users.id, userId));
  return toUserProfile(row);
}

/**
 * 닉네임 등 프로필 필드 업데이트
 */
export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, "displayName" | "avatarColors">>,
): Promise<UserProfile> {
  await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return getOrCreateUser(userId);
}

// ─── State ────────────────────────────────────────────────────────────────────

/**
 * 전체 앱 상태 조립 (없으면 user 생성 후 반환)
 */
export async function loadState(userId: string): Promise<DduimAppState> {
  const [user, courseRows, savedRows, likedRows] = await Promise.all([
    getOrCreateUser(userId),
    db
      .select()
      .from(courses)
      .where(and(eq(courses.ownerId, userId), isNull(courses.deletedAt))),
    db.select().from(savedCourses).where(eq(savedCourses.userId, userId)),
    db.select().from(likedPosts).where(eq(likedPosts.userId, userId)),
  ]);

  return {
    version: 1,
    currentUser: user,
    userCourses: courseRows.map(toCourse),
    publicCourses: [],
    savedCourseIds: savedRows.map((r) => r.courseId),
    likedPostIds: likedRows.map((r) => r.postId),
    updatedAt: new Date().toISOString(),
  };
}

export async function getShareableCourse(courseId: string): Promise<Course | null> {
  const [row] = await db
    .select()
    .from(courses)
    .where(and(ne(courses.visibility, "private"), eq(courses.id, courseId), isNull(courses.deletedAt)));

  return row ? { ...toCourse(row), mine: false } : null;
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function saveCourse(
  userId: string,
  course: Course,
): Promise<{ limitReached: boolean }> {
  const existing = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.ownerId, userId), isNull(courses.deletedAt)));

  if (existing.length >= COURSE_LIMIT) return { limitReached: true };

  await db
    .insert(courses)
    .values({
      id: course.id,
      ownerId: userId,
      title: course.title,
      area: course.area,
      distance: course.distance,
      minutes: course.minutes,
      elevation: course.elevation,
      color: course.color,
      author: course.author,
      saves: course.saves ?? 0,
      anchor: course.anchor,
      path: course.path,
      startPoint: course.startPoint ?? null,
      geoPath: course.geoPath ?? null,
      tags: course.tags,
      visibility: course.visibility ?? "private",
      source: course.source ?? "user",
      createdAt: course.createdAt ? new Date(course.createdAt) : new Date(),
      updatedAt: new Date(),
      deletedAt: course.deletedAt ? new Date(course.deletedAt) : null,
    })
    .onConflictDoUpdate({
      target: courses.id,
      set: {
        title: course.title,
        area: course.area,
        distance: course.distance,
        minutes: course.minutes,
        elevation: course.elevation,
        color: course.color,
        anchor: course.anchor,
        path: course.path,
        startPoint: course.startPoint ?? null,
        geoPath: course.geoPath ?? null,
        tags: course.tags,
        visibility: course.visibility ?? "private",
        updatedAt: new Date(),
      },
    });

  return { limitReached: false };
}

export async function updateCourse(
  userId: string,
  courseId: string,
  patch: { title?: string; tags?: Course["tags"]; visibility?: Course["visibility"] },
): Promise<Course | null> {
  const [row] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.ownerId, userId), isNull(courses.deletedAt)));
  if (!row) return null;

  const updated = await db
    .update(courses)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(courses.id, courseId))
    .returning();

  return updated[0] ? toCourse(updated[0]) : null;
}

// ─── Saved & Liked (full-replace sync) ───────────────────────────────────────

/**
 * 클라이언트 상태와 즐겨찾기 목록을 동기화 (PUT /api/state 에서 호출)
 */
export async function syncSavedCourses(userId: string, courseIds: string[]): Promise<void> {
  await db.delete(savedCourses).where(eq(savedCourses.userId, userId));
  if (courseIds.length > 0) {
    await db.insert(savedCourses).values(
      courseIds.map((courseId) => ({ userId, courseId })),
    );
  }
}

export async function syncLikedPosts(userId: string, postIds: string[]): Promise<void> {
  await db.delete(likedPosts).where(eq(likedPosts.userId, userId));
  if (postIds.length > 0) {
    await db.insert(likedPosts).values(
      postIds.map((postId) => ({ userId, postId })),
    );
  }
}
