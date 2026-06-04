import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL 환경변수가 없습니다.");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", prepare: false });

try {
  await sql`SELECT 1`;
  console.log("✅ Supabase keep-alive ping 성공:", new Date().toISOString());
} catch (e) {
  console.error("❌ Ping 실패:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
