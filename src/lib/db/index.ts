import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
}

// HMR 환경에서 커넥션 재생성 방지
const globalForDb = globalThis as unknown as { __pgClient?: postgres.Sql };

// Supabase PgBouncer(Transaction Mode) 사용 시 prepare: false 필수
const client = (globalForDb.__pgClient ??= postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: "require",
}));

export const db = drizzle(client, { schema });
