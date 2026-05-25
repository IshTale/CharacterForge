import { randomUUID } from "node:crypto";
import { PERFECTCORP_V2_BASE } from "@/lib/perfectcorp/api-env";
import { extractPollErrorMessage } from "@/lib/perfectcorp/poll-errors";
import { parseTaskResult } from "@/lib/perfectcorp/task-results";

export interface GenerateImageInput {
  prompt: string;
  slot_id?: string;
}

export interface GenerateImageResult {
  task_id: string | null;
  result_url: string | null;
  file_id: string | null;
  prompt: string;
}

async function resolveTemplateId(apiKey: string) {
  if (process.env.PERFECTCORP_TEXT_TO_IMAGE_TEMPLATE_ID?.trim()) {
    return process.env.PERFECTCORP_TEXT_TO_IMAGE_TEMPLATE_ID.trim();
  }

  const response = await fetch(
    `${PERFECTCORP_V2_BASE}/s2s/v2.0/task/template/text-to-image?page_size=1`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image generation templates failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as {
    data?: { templates?: Array<{ id?: string }> };
  };
  const templateId = payload.data?.templates?.[0]?.id;
  if (!templateId) {
    throw new Error(
      "Image generation requires a text-to-image template, but none were returned."
    );
  }
  return templateId;
}

export async function generateImageItem(input: GenerateImageInput): Promise<GenerateImageResult> {
  const apiKey = process.env.PERFECTCORP_V2_API_KEY;
  const fileId = `gen_${randomUUID()}`;

  if (!apiKey) {
    return {
      task_id: null,
      result_url: null,
      file_id: fileId,
      prompt: input.prompt
    };
  }

  const baseUrl = `${PERFECTCORP_V2_BASE}/s2s/v2.0`;
  const templateId = await resolveTemplateId(apiKey);
  const response = await fetch(`${baseUrl}/task/text-to-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: input.prompt,
      template_id: templateId,
      width_ratio: 1,
      height_ratio: 1
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image generation failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { data?: { task_id?: string } };
  const taskId = data.data?.task_id;
  if (!taskId) {
    throw new Error("Image generation response missing task_id.");
  }

  const pollUrl = `${baseUrl}/task/text-to-image/${taskId}`;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const poll = await fetch(pollUrl, {
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
      const parsed = parseTaskResult(pollData.data?.results, fileId);
      return {
        task_id: taskId,
        result_url: parsed.result_url,
        file_id: parsed.dst_id,
        prompt: input.prompt
      };
    }
    if (status === "error") {
      throw new Error(extractPollErrorMessage("/task/text-to-image", pollData));
    }
  }

  throw new Error("Image generation task timed out.");
}
