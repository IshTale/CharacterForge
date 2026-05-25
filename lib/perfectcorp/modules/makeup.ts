import { buildMakeupEffects } from "@/lib/makeup/build-effects";
import { extractPollErrorMessage } from "@/lib/perfectcorp/poll-errors";
import { parseTaskResult } from "@/lib/perfectcorp/task-results";
import type { MakeupApiEffect, MakeupVtoTaskPayload } from "@/types/makeup-api";
import type { MakeupConfig } from "@/types/recipe";

const PATTERN_CATEGORIES = new Set([
  "blush",
  "bronzer",
  "contour",
  "highlighter",
  "eye_shadow",
  "eye_liner",
  "eyelashes",
  "lip_liner"
]);

export function validateEffects(effects: unknown[]): asserts effects is MakeupApiEffect[] {
  if (!Array.isArray(effects)) {
    throw new Error("effects must be an array");
  }

  for (const effect of effects) {
    if (!effect || typeof effect !== "object" || !("category" in effect)) {
      throw new Error("Each effect must include a category.");
    }

    const category = (effect as MakeupApiEffect).category;

    if (category === "skin_smooth") {
      continue;
    }

    if (category === "foundation" || category === "concealer") {
      const palettes = (effect as { palettes?: unknown[] }).palettes;
      if (!Array.isArray(palettes) || palettes.length < 1) {
        throw new Error(`${category} requires at least one palette.`);
      }
      continue;
    }

    if (category === "lip_color") {
      const shape = (effect as { shape?: { name?: string } }).shape;
      if (!shape?.name) {
        throw new Error("lip_color requires shape.name.");
      }
      continue;
    }

    if (category === "eyebrows") {
      const pattern = (effect as { pattern?: { name?: string; type?: string } }).pattern;
      if (!pattern?.name || pattern.type !== "shape") {
        throw new Error("eyebrows requires pattern.type shape and pattern.name.");
      }
      continue;
    }

    if (PATTERN_CATEGORIES.has(category)) {
      const pattern = (effect as { pattern?: { name?: string } }).pattern;
      const palettes = (effect as { palettes?: unknown[] }).palettes;
      if (!pattern?.name) {
        throw new Error(`${category} requires pattern.name.`);
      }
      if (!Array.isArray(palettes) || palettes.length < 1) {
        throw new Error(`${category} requires at least one palette.`);
      }
    }
  }
}

export function buildMakeupTaskPayload(
  srcFileId: string,
  makeup: MakeupConfig
): MakeupVtoTaskPayload {
  const effects = buildMakeupEffects(makeup);
  validateEffects(effects);
  return {
    version: "1.0",
    src_file_id: srcFileId,
    effects
  };
}

export interface MakeupApplyResult {
  task_id: string | null;
  result_url: string | null;
  dst_id?: string | null;
  payload?: MakeupVtoTaskPayload;
}

export async function applyMakeup(payload: MakeupVtoTaskPayload): Promise<MakeupApplyResult> {
  validateEffects(payload.effects);

  const apiKey = process.env.PERFECTCORP_V2_API_KEY;
  if (!apiKey) {
    return {
      task_id: null,
      result_url: null,
      dst_id: `dst_makeup-vto_${Date.now()}`,
      payload
    };
  }

  const baseUrl = "https://yce-api-01.makeupar.com/s2s/v2.0";
  const response = await fetch(`${baseUrl}/task/makeup-vto`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version: payload.version,
      src_file_id: payload.src_file_id,
      effects: payload.effects
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Makeup VTO task failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { data?: { task_id?: string } };
  const taskId = data.data?.task_id;
  if (!taskId) {
    throw new Error("Makeup VTO response missing task_id.");
  }

  const pollUrl = `${baseUrl}/task/makeup-vto/${taskId}`;
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
      const parsed = parseTaskResult(pollData.data?.results);
      return {
        task_id: taskId,
        result_url: parsed.result_url,
        dst_id: parsed.dst_id,
        payload
      };
    }
    if (status === "error") {
      throw new Error(extractPollErrorMessage("/task/makeup-vto", pollData));
    }
  }

  throw new Error("Makeup VTO task timed out.");
}

export async function applyLookVto() {
  return { result_url: null as string | null };
}
