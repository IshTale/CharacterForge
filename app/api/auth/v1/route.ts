import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "v1 auth exchange not implemented yet." },
    { status: 501 }
  );
}
