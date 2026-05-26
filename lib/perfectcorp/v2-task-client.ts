import { randomUUID } from "node:crypto";
import { PERFECTCORP_V2_BASE, getV2ApiKey } from "@/lib/perfectcorp/api-env";
import { extractPollErrorMessage } from "@/lib/perfectcorp/poll-errors";
import { parseTaskResult } from "@/lib/perfectcorp/task-results";

export interface V2TaskResult {
  task_id: string | null;
  result_url: string | null;
  dst_id: string | null;
}

export async function postAndPollV2Task(
  taskPath: string,
  payload: Record<string, unknown>,
  options?: { apiVersion?: "v2.0" | "v2.1"; stubPrefix?: string }
): Promise<V2TaskResult> {
  const apiKey = getV2ApiKey();
  const version = options?.apiVersion ?? "v2.0";
  const stubPrefix = options?.stubPrefix ?? "task";
  const dstId = `dst_${stubPrefix}_${randomUUID()}`;

  if (!apiKey) {
    return { task_id: null, result_url: null, dst_id: dstId };
  }

  const baseUrl = `${PERFECTCORP_V2_BASE}/s2s/${version}`;
  const response = await fetch(`${baseUrl}${taskPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Task ${taskPath} failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { data?: { task_id?: string } };
  const taskId = data.data?.task_id;
  if (!taskId) {
    throw new Error(`Task ${taskPath} response missing task_id.`);
  }

  const pollPath = `${taskPath}/${taskId}`;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const poll = await fetch(`${baseUrl}${pollPath}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!poll.ok) {
      continue;
    }
    const pollData = (await poll.json()) as {
      data?: Record<string, unknown> & {
        task_status?: string;
        results?: unknown;
      };
    };
    const status = pollData.data?.task_status;
    if (status === "success") {
      const parsed = parseTaskResult(pollData.data?.results);
      return {
        task_id: taskId,
        result_url: parsed.result_url,
        dst_id: parsed.dst_id
      };
    }
    if (status === "error") {
      throw new Error(extractPollErrorMessage(taskPath, pollData));
    }
  }

  throw new Error(`Task ${taskPath} timed out.`);
}
