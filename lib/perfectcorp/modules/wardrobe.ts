import { randomUUID } from "node:crypto";
import { getV2ApiKey } from "@/lib/perfectcorp/api-env";
import { extractPollErrorMessage } from "@/lib/perfectcorp/poll-errors";
import { parseTaskResult } from "@/lib/perfectcorp/task-results";

export interface ClothTaskPayload {
  src_file_id: string;
  ref_file_id?: string;
  ref_file_url?: string;
  garment_category: "upper_body" | "lower_body" | "dresses" | "full_body";
  gender?: "female" | "male";
  change_shoes?: boolean;
}

export interface AccessoryTaskPayload {
  src_file_id: string;
  ref_file_id?: string;
  ref_file_url?: string;
  gender?: "female" | "male";
}

export interface WardrobeTaskResult {
  task_id: string | null;
  result_url: string | null;
  dst_id: string | null;
}

async function pollVtoTask(
  baseUrl: string,
  apiKey: string,
  pollPath: string
): Promise<WardrobeTaskResult> {
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
        task_id: null,
        result_url: parsed.result_url,
        dst_id: parsed.dst_id
      };
    }
    if (status === "error") {
      throw new Error(extractPollErrorMessage(pollPath, pollData));
    }
  }
  throw new Error("Wardrobe VTO task timed out.");
}

async function startVtoTask(
  module: "cloth" | "hat" | "bag" | "shoes",
  payload: Record<string, unknown>
): Promise<WardrobeTaskResult> {
  const apiKey = getV2ApiKey();
  const dstId = `dst_${module}_${randomUUID()}`;

  if (!apiKey) {
    return { task_id: null, result_url: null, dst_id: dstId };
  }

  const baseUrl = "https://yce-api-01.makeupar.com/s2s/v2.0";
  const response = await fetch(`${baseUrl}/task/${module}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${module} VTO failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { data?: { task_id?: string } };
  const taskId = data.data?.task_id;
  if (!taskId) {
    throw new Error(`${module} VTO response missing task_id.`);
  }

  const polled = await pollVtoTask(baseUrl, apiKey, `/task/${module}/${taskId}`);
  return { ...polled, task_id: taskId };
}

export async function applyCloth(payload: ClothTaskPayload): Promise<WardrobeTaskResult> {
  return startVtoTask("cloth", payload as unknown as Record<string, unknown>);
}

export async function applyHat(payload: AccessoryTaskPayload): Promise<WardrobeTaskResult> {
  return startVtoTask("hat", payload as unknown as Record<string, unknown>);
}

export async function applyBag(payload: AccessoryTaskPayload): Promise<WardrobeTaskResult> {
  return startVtoTask("bag", payload as unknown as Record<string, unknown>);
}

export async function applyShoes(payload: AccessoryTaskPayload): Promise<WardrobeTaskResult> {
  return startVtoTask("shoes", payload as unknown as Record<string, unknown>);
}

export async function chainClothes() {
  return { dst_id: `dst_chain_${randomUUID()}` };
}
