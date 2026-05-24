import { NextResponse } from "next/server";
import { RsaTokenManager } from "@/lib/auth/v1-rsa";

export async function POST() {
  const token = await RsaTokenManager.getInstance().getAccessToken();
  return NextResponse.json({ access_token: token });
}
