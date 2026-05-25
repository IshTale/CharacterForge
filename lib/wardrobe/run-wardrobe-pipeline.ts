import { runSseTask } from "@/lib/api/sse-task-client";
import {
  buildWardrobePipelineSteps,
  validateWardrobePipeline,
  type WardrobeFileIds
} from "@/lib/wardrobe/build-pipeline";
import type { CanvasKey } from "@/types/canvas";
import type { WardrobeConfig } from "@/types/wardrobe";

export interface WardrobePipelineResult {
  canvasResults: Partial<Record<CanvasKey, string | null>>;
  task_ids: string[];
}

export async function runWardrobePipeline(
  wardrobe: WardrobeConfig,
  fileIds: WardrobeFileIds
): Promise<WardrobePipelineResult> {
  const validationError = validateWardrobePipeline(wardrobe, fileIds);
  if (validationError) {
    throw new Error(validationError);
  }

  const steps = buildWardrobePipelineSteps(wardrobe, fileIds);
  const canvasResults: Partial<Record<CanvasKey, string | null>> = {};
  const taskIds: string[] = [];

  let fullbodySrc = fileIds.fullbody;

  for (const step of steps) {
    const payload = { ...step.payload };
    if (step.module === "cloth" && fullbodySrc) {
      payload.src_file_id = fullbodySrc;
    }
    if (step.module === "bag" && fullbodySrc) {
      payload.src_file_id = fullbodySrc;
    }

    const result = await runSseTask(step.module, payload);
    taskIds.push(result.task_id);

    if (result.result_url) {
      canvasResults[step.canvas] = result.result_url;
    }

    if (result.dst_id && (step.module === "cloth" || step.module === "bag")) {
      fullbodySrc = result.dst_id;
    }
  }

  return { canvasResults, task_ids: taskIds };
}

export async function generateWardrobeItem(prompt: string, slotId: string) {
  const result = await runSseTask("image-gen", { prompt, slot_id: slotId });
  return {
    ref_file_id: undefined,
    preview_url: result.result_url ?? undefined,
    ref_image_url: result.result_url ?? undefined
  };
}
