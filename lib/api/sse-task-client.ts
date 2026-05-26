import { MODULE_CONFIG } from "@/constants/api-modules";
import { CANVAS_UPLOAD_REQUIREMENTS } from "@/constants/upload-requirements";
import { compressImageForUpload } from "@/lib/validation/compress-upload-image";

const ACCESSORY_UPLOAD_MODULES = new Set([
  "hat",
  "bag",
  "ring",
  "bracelet",
  "watch",
  "necklace"
]);

function agentUploadDebugLog(
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
  void fetch("http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e6857c" },
    body: JSON.stringify(payload)
  }).catch(() => {});
  void fetch("/api/debug/client-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

function isReferenceUpload(module: string, usage?: string) {
  return usage === "reference" || ACCESSORY_UPLOAD_MODULES.has(module);
}

function compressOptionsForModule(module: string, usage?: string) {
  const config = MODULE_CONFIG[module];
  if (!config) {
    return { maxLongSidePx: 2048 };
  }
  const requirements = CANVAS_UPLOAD_REQUIREMENTS[config.sourceCanvas];
  return {
    maxLongSidePx: isReferenceUpload(module, usage) ? 1024 : requirements.maxLongSidePx
  };
}

export interface SseTaskResult {
  task_id: string;
  result_url: string | null;
  dst_id?: string | null;
}

function parseSseEvents(buffer: string): Array<{ event: string; data: unknown }> {
  const events: Array<{ event: string; data: unknown }> = [];
  const chunks = buffer.split("\n\n");

  for (const chunk of chunks) {
    if (!chunk.trim()) {
      continue;
    }
    let event = "message";
    let dataLine = "";
    for (const line of chunk.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLine = line.slice(5).trim();
      }
    }
    if (dataLine) {
      try {
        events.push({ event, data: JSON.parse(dataLine) });
      } catch {
        events.push({ event, data: dataLine });
      }
    }
  }

  return events;
}

export async function runSseTask(
  module: string,
  body: Record<string, unknown>
): Promise<SseTaskResult> {
  const response = await fetch(`/api/perfectcorp/${module}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `${module} task failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error(`${module} task returned no response stream.`);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let taskId = "";
  let resultUrl: string | null = null;
  let dstId: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const events = parseSseEvents(buffer);

    for (const { event, data } of events) {
      const payload = data as Record<string, unknown>;
      if (event === "task_started" && typeof payload.task_id === "string") {
        taskId = payload.task_id;
      }
      if (event === "task_complete") {
        if (typeof payload.task_id === "string") {
          taskId = payload.task_id;
        }
        if (typeof payload.result_url === "string") {
          resultUrl = payload.result_url;
        }
        if (typeof payload.dst_id === "string") {
          dstId = payload.dst_id;
        }
      }
      if (event === "error") {
        throw new Error(
          typeof payload.message === "string" ? payload.message : `${module} task failed.`
        );
      }
    }
  }

  if (!taskId) {
    throw new Error(`${module} task did not return a task id.`);
  }

  return { task_id: taskId, result_url: resultUrl, dst_id: dstId };
}

export interface UploadModuleFileOptions {
  /** e.g. `design` for press-on nail art (PNG) vs default canvas source photo */
  usage?: string;
  /** Keep original bytes (required for transparent PNG nail art) */
  preserveOriginal?: boolean;
}

export async function uploadModuleFile(
  file: File,
  module: string,
  options?: UploadModuleFileOptions
): Promise<{ file_id: string; public_url?: string }> {
  const uploadFile = options?.preserveOriginal
    ? file
    : await compressImageForUpload(file, compressOptionsForModule(module, options?.usage));
  const form = new FormData();
  form.append("file", uploadFile);
  const query = options?.usage ? `?usage=${encodeURIComponent(options.usage)}` : "";
  // #region agent log
  agentUploadDebugLog(
    "H1,H2,H4,H5",
    "lib/api/sse-task-client.ts:uploadModuleFile:before-fetch",
    "Client upload request prepared",
    {
      module,
      usage: options?.usage ?? null,
      preserveOriginal: Boolean(options?.preserveOriginal),
      originalType: file.type,
      originalSize: file.size,
      uploadType: uploadFile.type,
      uploadSize: uploadFile.size
    }
  );
  // #endregion
  const response = await fetch(`/api/perfectcorp/${module}/file${query}`, {
    method: "POST",
    body: form
  });
  const responseContentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();
  const responsePreview = responseText.slice(0, 120);
  // #region agent log
  agentUploadDebugLog(
    "H1,H2,H4",
    "lib/api/sse-task-client.ts:uploadModuleFile:after-response",
    "Client upload response received",
    {
      module,
      status: response.status,
      ok: response.ok,
      contentType: responseContentType,
      bodyLength: responseText.length,
      firstChar: responseText[0] ?? null,
      startsWithHtml: responseText.trimStart().startsWith("<"),
      preview: responsePreview
    }
  );
  // #endregion
  if (!response.ok) {
    const payload = (() => {
      try {
        return JSON.parse(responseText) as { error?: string };
      } catch {
        return {};
      }
    })();
    const fallback =
      response.status === 413
        ? "Upload is too large for hosting limits. Try a smaller image."
        : response.status === 503
        ? "Upload storage is not configured. Add BLOB_READ_WRITE_TOKEN to .env.local or use local dev uploads."
        : `Upload failed for ${module} (${response.status}).`;
    throw new Error(payload.error ?? fallback);
  }
  try {
    return JSON.parse(responseText) as { file_id: string; public_url?: string };
  } catch (parseError) {
    const rawFileId = responseText.trim();
    // #region agent log
    agentUploadDebugLog(
      "H1,H4",
      "lib/api/sse-task-client.ts:uploadModuleFile:parse-error",
      "Client failed to parse successful upload response JSON",
      {
        module,
        status: response.status,
        contentType: responseContentType,
        bodyLength: responseText.length,
        firstChar: responseText[0] ?? null,
        startsWithHtml: responseText.trimStart().startsWith("<"),
        error: parseError instanceof Error ? parseError.message : String(parseError),
        preview: responsePreview
      }
    );
    // #endregion
    if (rawFileId && !responseText.trimStart().startsWith("<")) {
      // #region agent log
      agentUploadDebugLog(
        "H8",
        "lib/api/sse-task-client.ts:uploadModuleFile:raw-file-id-fallback",
        "Client recovered upload response as raw file id",
        {
          module,
          status: response.status,
          contentType: responseContentType,
          bodyLength: responseText.length,
          firstChar: responseText[0] ?? null
        }
      );
      // #endregion
      return { file_id: rawFileId };
    }
    throw parseError;
  }
}
