import { PERFECTCORP_V2_BASE, getV2ApiKey } from "@/lib/perfectcorp/api-env";
import { resolvePerfectCorpFilePath } from "@/lib/perfectcorp/file-path";

function agentPerfectCorpUploadDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  const payload = {
    sessionId: "e6857c",
    runId: "pre-fix",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now()
  };
  console.info("[agent-debug-perfectcorp-upload]", payload);
  void fetch("http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e6857c" },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

function normalizeContentType(contentType: string) {
  if (contentType === "image/png") {
    return "image/png";
  }
  return "image/jpg";
}

function leadingCharCodes(value: string) {
  return Array.from(value.slice(0, 8)).map((char) => char.charCodeAt(0));
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
  const initContentType = initResponse.headers.get("content-type") ?? "";
  const initText = await initResponse.text();
  // #region agent log
  agentPerfectCorpUploadDebugLog(
    "H6",
    "lib/perfectcorp/upload-file.ts:uploadPerfectCorpFile:init-response",
    "Perfect Corp file init response received",
    {
      module,
      apiVersion,
      segment,
      status: initResponse.status,
      ok: initResponse.ok,
      contentType: initContentType,
      bodyLength: initText.length,
      firstChar: initText[0] ?? null,
      leadingCharCodes: leadingCharCodes(initText)
    }
  );
  // #endregion

  if (!initResponse.ok) {
    throw new Error(`Perfect Corp file init failed (${initResponse.status}): ${initText}`);
  }

  let initJson: {
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
  try {
    initJson = JSON.parse(initText) as typeof initJson;
  } catch (parseError) {
    // #region agent log
    agentPerfectCorpUploadDebugLog(
      "H6",
      "lib/perfectcorp/upload-file.ts:uploadPerfectCorpFile:init-parse-error",
      "Perfect Corp file init response was not valid JSON",
      {
        module,
        apiVersion,
        segment,
        status: initResponse.status,
        contentType: initContentType,
        bodyLength: initText.length,
        firstChar: initText[0] ?? null,
        leadingCharCodes: leadingCharCodes(initText),
        error: parseError instanceof Error ? parseError.message : String(parseError)
      }
    );
    // #endregion
    throw parseError;
  }

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
  // #region agent log
  agentPerfectCorpUploadDebugLog(
    "H7",
    "lib/perfectcorp/upload-file.ts:uploadPerfectCorpFile:put-response",
    "Perfect Corp presigned upload response received",
    {
      module,
      apiVersion,
      segment,
      status: putResponse.status,
      ok: putResponse.ok,
      contentType: putResponse.headers.get("content-type") ?? "",
      hasContentLength: Boolean(putResponse.headers.get("content-length"))
    }
  );
  // #endregion

  if (!putResponse.ok) {
    const text = await putResponse.text();
    throw new Error(`Perfect Corp file upload failed (${putResponse.status}): ${text}`);
  }

  return fileId;
}
