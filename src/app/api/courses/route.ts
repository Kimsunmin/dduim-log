import { NextRequest, NextResponse } from "next/server";
import { loadState, saveCourse } from "@/lib/server/store";
import type { Course } from "@/lib/dduim/types";

export async function POST(req: NextRequest) {
  const body = await req.json() as { uid?: string; course?: Course };
  const { uid, course } = body;
  if (!uid || !course) return NextResponse.json({ error: "uid and course required" }, { status: 400 });

  const result = await saveCourse(uid, course);
  if (result.limitReached) return NextResponse.json({ limitReached: true }, { status: 429 });

  return NextResponse.json(await loadState(uid));
}
