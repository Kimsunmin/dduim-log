import { NextRequest, NextResponse } from "next/server";
import { getShareableCourse, updateCourse } from "@/lib/server/store";
import type { Course } from "@/lib/dduim/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const course = await getShareableCourse(id);
  if (!course) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json(course);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json() as {
    uid?: string;
    patch?: { title?: string; tags?: Course["tags"]; visibility?: Course["visibility"] };
  };
  const { uid, patch } = body;
  if (!uid || !patch) return NextResponse.json({ error: "uid and patch required" }, { status: 400 });

  const updated = await updateCourse(uid, id, patch);
  if (!updated) return NextResponse.json({ error: "not found or forbidden" }, { status: 404 });

  return NextResponse.json(updated);
}
