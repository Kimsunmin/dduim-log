import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  CourseSource,
  CourseTag,
  CourseVisibility,
  LatLngLiteral,
  NormalizedPoint,
  TagColor,
} from "@/lib/dduim/types";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name").notNull().default("이름없는 러너"),
  avatarColors: jsonb("avatar_colors").$type<[string, string]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // Kakao Auth 연동 시 채워짐
  kakaoId: text("kakao_id"),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  area: text("area").notNull().default(""),
  distance: real("distance").notNull().default(0),
  minutes: integer("minutes").notNull().default(0),
  elevation: real("elevation").notNull().default(0),
  color: text("color").$type<TagColor>().notNull().default("mint"),
  author: text("author").notNull().default(""),
  saves: integer("saves").notNull().default(0),
  anchor: jsonb("anchor").$type<NormalizedPoint>().notNull(),
  path: jsonb("path").$type<NormalizedPoint[]>().notNull(),
  startPoint: jsonb("start_point").$type<LatLngLiteral>(),
  geoPath: jsonb("geo_path").$type<LatLngLiteral[]>(),
  tags: jsonb("tags").$type<CourseTag[]>().notNull(),
  visibility: text("visibility").$type<CourseVisibility>().notNull().default("private"),
  source: text("source").$type<CourseSource>().notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const savedCourses = pgTable(
  "saved_courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    courseId: text("course_id").notNull().references(() => courses.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("saved_courses_user_course_uniq").on(t.userId, t.courseId)],
);

// posts 테이블이 생기기 전까지 post_id 는 text 로 관리
export const likedPosts = pgTable(
  "liked_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    postId: text("post_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("liked_posts_user_post_uniq").on(t.userId, t.postId)],
);
