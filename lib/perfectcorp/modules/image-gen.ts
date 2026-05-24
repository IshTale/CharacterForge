import { randomUUID } from "node:crypto";

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

  const baseUrl = "https://yce-api-01.makeupar.com/s2s/v2.0";
  const response = await fetch(`${baseUrl}/task/image-gen`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      request_id: 1,
      payload: {
        actions: [
          {
            id: 0,
            params: {
              prompt: input.prompt,
              style_ids: []
            }
          }
        ]
      }
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

  const pollUrl = `${baseUrl}/task/image-gen/${taskId}`;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const poll = await fetch(pollUrl, {
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
      const resultUrl = pollData.data?.results?.[0]?.url ?? null;
      const dstId = pollData.data?.results?.[0]?.data?.[0]?.dst_id ?? fileId;
      return {
        task_id: taskId,
        result_url: resultUrl,
        file_id: dstId,
        prompt: input.prompt
      };
    }
    if (status === "error") {
      throw new Error("Image generation task returned error status.");
    }
  }

  throw new Error("Image generation task timed out.");
}
