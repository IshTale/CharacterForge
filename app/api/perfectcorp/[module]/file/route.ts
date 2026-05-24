import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { BlobStorage } from "@/lib/storage/blob";
import { resolveUploadBaseUrl } from "@/lib/storage/local-uploads";
import { KvCache } from "@/lib/storage/kv";
import { assertSupportedImageMime } from "@/lib/validation/mime";
import { ImageValidator } from "@/lib/validation/upload";

interface RouteContext {
  params: Promise<{ module: string }>;
}

/** Accessory reference uploads only (not base canvas photos). */
const ACCESSORY_ONLY_MODULES = new Set([
  "hat",
  "bag",
  "ring",
  "bracelet",
  "watch",
  "necklace"
]);

function validateByCanvas(
  canvas: "headshot" | "fullbody" | "handwrist" | "feet",
  file: { type: string; size: number; name: string },
  bytes: Uint8Array
) {
  ImageValidator.validateCanvasBuffer(canvas, file, bytes);
}

export async function POST(request: Request, context: RouteContext) {
  const { module } = await context.params;
  const moduleConfig = MODULE_CONFIG[module];
  if (!moduleConfig) {
    return NextResponse.json({ error: `Unsupported module: ${module}` }, { status: 400 });
  }

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
    const fileLike = { type: contentType, size: file.size, name: file.name };

    if (ACCESSORY_ONLY_MODULES.has(module)) {
      ImageValidator.validateAccessory(fileLike, byteView);
    } else {
      validateByCanvas(moduleConfig.sourceCanvas, fileLike, byteView);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid upload." },
      { status: 400 }
    );
  }

  const kvCache = new KvCache();
  const hash = createHash("sha256").update(bytes).digest("hex");
  const cacheKey = `${module}:${hash}`;

  const cachedFileId = await kvCache.getFileId(cacheKey);
  if (cachedFileId) {
    const cachedUrl = await kvCache.getFileUrl(cachedFileId);
    return NextResponse.json({
      module,
      file_id: cachedFileId,
      public_url: cachedUrl
    });
  }

  const fileId = `file_${randomUUID()}`;
  const baseUrl = resolveUploadBaseUrl(request);

  try {
    const blobStorage = new BlobStorage();
    const publicUrl = await blobStorage.upload(
      `${module}/${fileId}-${file.name}`,
      bytes,
      contentType,
      { fileId, baseUrl }
    );
    await kvCache.setFileId(cacheKey, fileId);
    await kvCache.setFileUrl(fileId, publicUrl);

    return NextResponse.json({
      module,
      file_id: fileId,
      public_url: publicUrl
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Upload storage failed. Set BLOB_READ_WRITE_TOKEN or use local dev mode.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
