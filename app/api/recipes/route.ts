import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: [], total: 0 });
}

export async function POST(_request: Request) {
  return NextResponse.json(
    { message: "Recipe persistence not implemented yet." },
    { status: 501 }
  );
}
