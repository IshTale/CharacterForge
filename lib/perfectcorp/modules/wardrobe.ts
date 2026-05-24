import { randomUUID } from "node:crypto";

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
      data?: {
        task_status?: string;
        results?: Array<{ url?: string; data?: Array<{ dst_id?: string }> }>;
      };
    };
    const status = pollData.data?.task_status;
    if (status === "success") {
      return {
        task_id: null,
        result_url: pollData.data?.results?.[0]?.url ?? null,
        dst_id: pollData.data?.results?.[0]?.data?.[0]?.dst_id ?? null
      };
    }
    if (status === "error") {
      throw new Error("Wardrobe VTO task returned error status.");
    }
  }
  throw new Error("Wardrobe VTO task timed out.");
}

async function startVtoTask(
  module: "cloth" | "hat" | "bag" | "shoes",
  payload: Record<string, unknown>
): Promise<WardrobeTaskResult> {
  const apiKey = process.env.PERFECTCORP_V2_API_KEY;
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
