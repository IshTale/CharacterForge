import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { BlobStorage } from "@/lib/storage/blob";
import { resolveUploadBaseUrl } from "@/lib/storage/local-uploads";
import { assertSupportedImageMime } from "@/lib/validation/mime";
import { ImageValidator } from "@/lib/validation/upload";

function safeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-") || "cover.jpg";
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file form field." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const byteView = new Uint8Array(bytes);

  let contentType: string;
  try {
    contentType = assertSupportedImageMime(file.type, file.name, byteView);
    ImageValidator.validateAccessory(
      { type: contentType, size: file.size, name: file.name },
      byteView
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid cover image." },
      { status: 400 }
    );
  }

  try {
    const fileId = `recipe_cover_${randomUUID()}`;
    const baseUrl = resolveUploadBaseUrl(request);
    const url = await new BlobStorage().upload(
      `recipes/covers/${fileId}-${safeFilename(file.name)}`,
      bytes,
      contentType,
      { fileId, baseUrl }
    );

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Upload storage failed. Set BLOB_READ_WRITE_TOKEN or use local dev mode.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
