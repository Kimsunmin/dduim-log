import { NextRequest, NextResponse } from "next/server";
import { loadState, updateUserProfile } from "@/lib/server/store";

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { uid?: string; displayName?: string };
  const { uid, displayName } = body;
  if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 });

  const name = String(displayName ?? "").trim().slice(0, 20);
  if (!name) return NextResponse.json({ error: "displayName required" }, { status: 400 });

  await updateUserProfile(uid, { displayName: name });
  return NextResponse.json(await loadState(uid));
}
