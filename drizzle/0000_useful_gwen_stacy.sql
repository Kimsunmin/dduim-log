CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"distance" real DEFAULT 0 NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"elevation" real DEFAULT 0 NOT NULL,
	"color" text DEFAULT 'mint' NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"anchor" jsonb NOT NULL,
	"path" jsonb NOT NULL,
	"start_point" jsonb,
	"geo_path" jsonb,
	"tags" jsonb NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"source" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "liked_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text DEFAULT '이름없는 러너' NOT NULL,
	"avatar_colors" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kakao_id" text
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liked_posts" ADD CONSTRAINT "liked_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "liked_posts_user_post_uniq" ON "liked_posts" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_courses_user_course_uniq" ON "saved_courses" USING btree ("user_id","course_id");