import { NextRequest, NextResponse } from "next/server";
import { loadState, saveState } from "@/lib/server/memory-store";

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { uid?: string; displayName?: string };
  const { uid, displayName } = body;
  if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 });

  const name = String(displayName ?? "").trim().slice(0, 20);
  if (!name) return NextResponse.json({ error: "displayName required" }, { status: 400 });

  const state = loadState(uid);
  const updated = {
    ...state,
    currentUser: {
      ...state.currentUser,
      displayName: name,
      updatedAt: new Date().toISOString(),
    },
  };
  saveState(uid, updated);
  return NextResponse.json(loadState(uid));
}
