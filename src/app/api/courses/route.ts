import { NextRequest, NextResponse } from "next/server";
import { loadState, saveState, COURSE_LIMIT } from "@/lib/server/memory-store";
import type { Course } from "@/lib/dduim/types";

export async function POST(req: NextRequest) {
  const body = await req.json() as { uid?: string; course?: Course };
  const { uid, course } = body;
  if (!uid || !course) return NextResponse.json({ error: "uid and course required" }, { status: 400 });

  const state = loadState(uid);
  const activeCourses = state.userCourses.filter(c => !c.deletedAt);

  if (activeCourses.length >= COURSE_LIMIT) {
    return NextResponse.json({ limitReached: true }, { status: 429 });
  }

  const updated = {
    ...state,
    userCourses: [
      { ...course, mine: true, ownerId: uid },
      ...state.userCourses.filter(c => c.id !== course.id),
    ],
  };
  saveState(uid, updated);
  return NextResponse.json(loadState(uid));
}
