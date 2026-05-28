import { NextRequest, NextResponse } from "next/server";
import { loadState, saveState } from "@/lib/server/memory-store";
import type { DduimAppState } from "@/lib/dduim/types";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 });
  return NextResponse.json(loadState(uid));
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as { uid?: string; state?: DduimAppState };
  const { uid, state } = body;
  if (!uid || !state) return NextResponse.json({ error: "uid and state required" }, { status: 400 });
  saveState(uid, state);
  return NextResponse.json(loadState(uid));
}
