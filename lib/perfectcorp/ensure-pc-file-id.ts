import { getV2ApiKey } from "@/lib/perfectcorp/api-env";
import { isLocalProxyFileId } from "@/lib/perfectcorp/proxy-file-id";
import { uploadPerfectCorpFile } from "@/lib/perfectcorp/upload-file";
import type { RedisCache } from "@/lib/storage/redis";

function guessContentType(url: string, fallback: string) {
  const lower = url.toLowerCase();
  if (lower.includes(".png")) {
    return "image/png";
  }
  return fallback;
}

function isRemoteImageUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function fileNameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").filter(Boolean).pop() ?? "result.jpg";
  } catch {
    return "result.jpg";
  }
}

/**
 * Re-register a blob/local preview file with Perfect Corp when tasks receive a proxy file_id.
 */
export async function ensurePerfectCorpFileId(
  module: string,
  fileId: string,
  redisCache: RedisCache
): Promise<string> {
  if (!getV2ApiKey()) {
    return fileId;
  }

  const publicUrl = isRemoteImageUrl(fileId) ? fileId : await redisCache.getFileUrl(fileId);
  const remoteInput = isRemoteImageUrl(fileId);
  const localProxyInput = isLocalProxyFileId(fileId);
  if (!remoteInput && !localProxyInput) {
    return fileId;
  }
  if (!publicUrl) {
    throw new Error(
      "This photo must be uploaded again. The stored file id is only valid for local preview."
    );
  }

  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(
      `Could not read uploaded image (${response.status}). Re-upload the photo and try again.`
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = guessContentType(
    publicUrl,
    response.headers.get("content-type") ?? "image/jpeg"
  );
  const fileName = fileNameFromUrl(publicUrl);

  const perfectCorpFileId = await uploadPerfectCorpFile(
    module,
    bytes,
    fileName,
    contentType.startsWith("image/") ? contentType : "image/jpeg"
  );

  await redisCache.setFileUrl(perfectCorpFileId, publicUrl);
  return perfectCorpFileId;
}

export async function ensurePerfectCorpFileIds(
  module: string,
  fileIds: string[],
  redisCache: RedisCache
) {
  return Promise.all(fileIds.map((fileId) => ensurePerfectCorpFileId(module, fileId, redisCache)));
}
