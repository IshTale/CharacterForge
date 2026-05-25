import { PERFECTCORP_V2_BASE, getV2ApiKey } from "@/lib/perfectcorp/api-env";
import { resolvePerfectCorpFilePath } from "@/lib/perfectcorp/file-path";

function normalizeContentType(contentType: string) {
  if (contentType === "image/png") {
    return "image/png";
  }
  return "image/jpg";
}

/**
 * Perfect Corp file lifecycle: POST file metadata → PUT bytes to presigned URL → use file_id in tasks.
 */
export async function uploadPerfectCorpFile(
  module: string,
  bytes: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const apiKey = getV2ApiKey();
  if (!apiKey) {
    throw new Error("PERFECTCORP_V2_API_KEY is not configured.");
  }

  const { apiVersion, segment } = resolvePerfectCorpFilePath(module);
  const initUrl = `${PERFECTCORP_V2_BASE}/s2s/${apiVersion}/file/${segment}`;
  const normalizedType = normalizeContentType(contentType);

  const initResponse = await fetch(initUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      files: [
        {
          content_type: normalizedType,
          file_name: fileName,
          file_size: bytes.length
        }
      ]
    })
  });

  if (!initResponse.ok) {
    const text = await initResponse.text();
    throw new Error(`Perfect Corp file init failed (${initResponse.status}): ${text}`);
  }

  const initJson = (await initResponse.json()) as {
    data?: {
      files?: Array<{
        file_id?: string;
        requests?: Array<{
          url?: string;
          method?: string;
          headers?: Record<string, string>;
        }>;
      }>;
    };
  };

  const fileEntry = initJson.data?.files?.[0];
  const fileId = fileEntry?.file_id;
  const uploadRequest = fileEntry?.requests?.[0];
  if (!fileId || !uploadRequest?.url) {
    throw new Error("Perfect Corp file response missing file_id or upload URL.");
  }

  const putHeaders = { ...(uploadRequest.headers ?? {}) };
  if (!putHeaders["Content-Type"] && !putHeaders["content-type"]) {
    putHeaders["Content-Type"] = normalizedType;
  }

  const putResponse = await fetch(uploadRequest.url, {
    method: uploadRequest.method ?? "PUT",
    headers: putHeaders,
    body: new Uint8Array(bytes)
  });

  if (!putResponse.ok) {
    const text = await putResponse.text();
    throw new Error(`Perfect Corp file upload failed (${putResponse.status}): ${text}`);
  }

  return fileId;
}
