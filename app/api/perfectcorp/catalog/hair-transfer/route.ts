import { NextResponse } from "next/server";
import { fetchHairTransferTemplates } from "@/lib/perfectcorp/hair-catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageSize = Number(searchParams.get("page_size") ?? "20");
  const startingToken = searchParams.get("starting_token") ?? undefined;

  try {
    const data = await fetchHairTransferTemplates(pageSize, startingToken);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load hair templates." },
      { status: 502 }
    );
  }
}
