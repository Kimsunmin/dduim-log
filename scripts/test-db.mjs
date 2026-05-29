import postgres from "postgres";

const url = "postgresql://postgres:CxOdjprwv6bmxNVP@db.bwnxpuyubeoreupdkmam.supabase.co:5432/postgres";
const sql = postgres(url, { ssl: "require", prepare: false });

try {
  const result = await sql`SELECT 1 as ok`;
  console.log("✅ 연결 성공:", result);
} catch (e) {
  console.error("❌ 연결 실패:", e.message);
} finally {
  await sql.end();
}
