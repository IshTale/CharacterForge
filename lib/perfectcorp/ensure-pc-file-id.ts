import { getV2ApiKey } from "@/lib/perfectcorp/api-env";
import { isLocalProxyFileId } from "@/lib/perfectcorp/proxy-file-id";
import { uploadPerfectCorpFile } from "@/lib/perfectcorp/upload-file";
import type { KvCache } from "@/lib/storage/kv";

function guessContentType(url: string, fallback: string) {
  const lower = url.toLowerCase();
  if (lower.includes(".png")) {
    return "image/png";
  }
  return fallback;
}

/**
 * Re-register a blob/local preview file with Perfect Corp when tasks receive a proxy file_id.
 */
export async function ensurePerfectCorpFileId(
  module: string,
  fileId: string,
  kvCache: KvCache
): Promise<string> {
  if (!getV2ApiKey() || !isLocalProxyFileId(fileId)) {
    return fileId;
  }

  const publicUrl = await kvCache.getFileUrl(fileId);
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
  const fileName = publicUrl.split("/").pop() ?? "upload.jpg";

  const perfectCorpFileId = await uploadPerfectCorpFile(
    module,
    bytes,
    fileName,
    contentType.startsWith("image/") ? contentType : "image/jpeg"
  );

  await kvCache.setFileUrl(perfectCorpFileId, publicUrl);
  return perfectCorpFileId;
}
