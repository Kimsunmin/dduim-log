import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel Cron Job 요청인지 검증 (CRON_SECRET 환경변수로 보호)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 가장 가벼운 쿼리로 DB 활성 상태 유지
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[keep-alive] DB ping failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
