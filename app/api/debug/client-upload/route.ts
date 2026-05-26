import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as unknown;
  console.info("[agent-debug-client-upload]", payload);
  return NextResponse.json({ ok: true });
}
