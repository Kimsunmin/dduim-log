import { defineConfig } from "drizzle-kit";

function dbUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  // Supabase 직접 연결은 SSL 필수 — URL에 파라미터로 강제 주입
  const url = new URL(raw);
  // if (!url.searchParams.has("sslmode")) {
  //   url.searchParams.set("sslmode", "require");
  // }

  console.log("Using database URL:", url.toString());
  return url.toString();
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dbUrl(),
  },
});
