import { randomUUID } from "node:crypto";
import { PERFECTCORP_V2_BASE } from "@/lib/perfectcorp/api-env";

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
  const apiKey = process.env.PERFECTCORP_V2_API_KEY;
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
      data?: {
        task_status?: string;
        results?: Array<{ url?: string; data?: Array<{ dst_id?: string }> }>;
      };
    };
    const status = pollData.data?.task_status;
    if (status === "success") {
      return {
        task_id: taskId,
        result_url: pollData.data?.results?.[0]?.url ?? null,
        dst_id: pollData.data?.results?.[0]?.data?.[0]?.dst_id ?? null
      };
    }
    if (status === "error") {
      throw new Error(`Task ${taskPath} returned error status.`);
    }
  }

  throw new Error(`Task ${taskPath} timed out.`);
}
