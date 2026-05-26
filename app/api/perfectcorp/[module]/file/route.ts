import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { getV2ApiKey } from "@/lib/perfectcorp/api-env";
import { isLocalProxyFileId } from "@/lib/perfectcorp/proxy-file-id";
import { uploadPerfectCorpFile } from "@/lib/perfectcorp/upload-file";
import { BlobStorage } from "@/lib/storage/blob";
import { resolveUploadBaseUrl } from "@/lib/storage/local-uploads";
import { RedisCache } from "@/lib/storage/redis";
import { assertSupportedImageMime } from "@/lib/validation/mime";
import { validatePressOnNailDesignBuffer } from "@/lib/validation/nail-design";
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

/** Only standalone design assets are durable app storage; person/base photos are transient. */
function shouldStoreReferenceImage(module: string, usage: string | null) {
  return (
    usage === "reference" ||
    (module === "nail-vto" && usage === "design") ||
    ACCESSORY_ONLY_MODULES.has(module)
  );
}

function validateByCanvas(
  canvas: "headshot" | "fullbody" | "handwrist" | "feet",
  file: { type: string; size: number; name: string },
  bytes: Uint8Array
) {
  ImageValidator.validateCanvasBuffer(canvas, file, bytes);
}

export async function POST(request: Request, context: RouteContext) {
  const { module } = await context.params;
  const usage = new URL(request.url).searchParams.get("usage");
  const storesReferenceImage = shouldStoreReferenceImage(module, usage);
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

    if (module === "nail-vto" && usage === "design") {
      validatePressOnNailDesignBuffer(fileLike, byteView);
    } else if (storesReferenceImage) {
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

  const redisCache = new RedisCache();
  const hash = createHash("sha256").update(bytes).digest("hex");
  const cacheKey = `${module}:${hash}`;

  const cachedFileId = storesReferenceImage ? await redisCache.getFileId(cacheKey) : null;
  if (storesReferenceImage && cachedFileId) {
    const cachedUrl = await redisCache.getFileUrl(cachedFileId);
    const cacheIsValid =
      !getV2ApiKey() || !isLocalProxyFileId(cachedFileId);

    if (cacheIsValid) {
      return NextResponse.json({
        module,
        file_id: cachedFileId,
        public_url: cachedUrl
      });
    }

    if (cachedUrl) {
      try {
        const refetch = await fetch(cachedUrl);
        if (refetch.ok) {
          const refetchBytes = Buffer.from(await refetch.arrayBuffer());
          const contentTypeHeader =
            refetch.headers.get("content-type") ?? contentType;
          const pcFileId = await uploadPerfectCorpFile(
            module,
            refetchBytes,
            file.name,
            contentTypeHeader.startsWith("image/") ? contentTypeHeader : contentType
          );
          await redisCache.setFileId(cacheKey, pcFileId);
          await redisCache.setFileUrl(pcFileId, cachedUrl);
          return NextResponse.json({
            module,
            file_id: pcFileId,
            public_url: cachedUrl
          });
        }
      } catch (reuploadError) {
        console.error("[perfectcorp/file] cache re-upload", reuploadError);
      }
    }
  }

  const previewFileId = `file_${randomUUID()}`;
  const baseUrl = resolveUploadBaseUrl(request);

  if (!storesReferenceImage) {
    if (!getV2ApiKey()) {
      return NextResponse.json({
        module,
        file_id: previewFileId
      });
    }

    try {
      const taskFileId = await uploadPerfectCorpFile(module, bytes, file.name, contentType);
      return NextResponse.json({
        module,
        file_id: taskFileId
      });
    } catch (perfectCorpError) {
      console.error("[perfectcorp/file]", perfectCorpError);
      return NextResponse.json(
        {
          error:
            perfectCorpError instanceof Error
              ? perfectCorpError.message
              : "Perfect Corp file upload failed."
        },
        { status: 502 }
      );
    }
  }

  try {
    const blobStorage = new BlobStorage();
    const publicUrl = await blobStorage.upload(
      `${module}/${previewFileId}-${file.name}`,
      bytes,
      contentType,
      { fileId: previewFileId, baseUrl }
    );

    if (!getV2ApiKey()) {
      await redisCache.setFileId(cacheKey, previewFileId);
      await redisCache.setFileUrl(previewFileId, publicUrl);
      return NextResponse.json({
        module,
        file_id: previewFileId,
        public_url: publicUrl
      });
    }

    let taskFileId: string;
    try {
      taskFileId = await uploadPerfectCorpFile(module, bytes, file.name, contentType);
    } catch (perfectCorpError) {
      console.error("[perfectcorp/file]", perfectCorpError);
      return NextResponse.json(
        {
          error:
            perfectCorpError instanceof Error
              ? perfectCorpError.message
              : "Perfect Corp file upload failed."
        },
        { status: 502 }
      );
    }

    await redisCache.setFileId(cacheKey, taskFileId);
    await redisCache.setFileUrl(taskFileId, publicUrl);

    return NextResponse.json({
      module,
      file_id: taskFileId,
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
