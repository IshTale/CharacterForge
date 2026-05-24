import { NextResponse } from "next/server";
import { readLocalUpload } from "@/lib/storage/local-uploads";

interface RouteContext {
  params: Promise<{ fileId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { fileId } = await context.params;
  const record = await readLocalUpload(fileId);
  if (!record) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(record.bytes), {
    headers: {
      "Content-Type": record.mimeType,
      "Cache-Control": "public, max-age=86400"
    }
  });
}
