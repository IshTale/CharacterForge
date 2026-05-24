import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { BlobStorage } from "@/lib/storage/blob";
import { KvCache } from "@/lib/storage/kv";
import { ImageValidator } from "@/lib/validation/upload";

interface RouteContext {
  params: Promise<{ module: string }>;
}

function validateByCanvas(
  canvas: "headshot" | "fullbody" | "handwrist" | "feet",
  file: { type: string; size: number }
) {
  if (canvas === "headshot") ImageValidator.validateHeadshot(file);
  if (canvas === "fullbody") ImageValidator.validateFullBody(file);
  if (canvas === "handwrist") ImageValidator.validateHandWrist(file);
  if (canvas === "feet") ImageValidator.validateFeet(file);
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

  try {
    validateByCanvas(moduleConfig.sourceCanvas, { type: file.type, size: file.size });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid upload." },
      { status: 400 }
    );
  }

  const blobStorage = new BlobStorage();
  const kvCache = new KvCache();
  const bytes = Buffer.from(await file.arrayBuffer());
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
  const publicUrl = await blobStorage.upload(
    `${module}/${fileId}-${file.name}`,
    bytes,
    file.type || "application/octet-stream"
  );
  await kvCache.setFileId(cacheKey, fileId);
  await kvCache.setFileUrl(fileId, publicUrl);

  return NextResponse.json({
    module,
    file_id: fileId,
    public_url: publicUrl
  });
}
