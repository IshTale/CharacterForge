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
  canvasFileIds: Partial<Record<CanvasKey, string | null>>;
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
  const canvasFileIds: Partial<Record<CanvasKey, string | null>> = {};
  const taskIds: string[] = [];

  let fullbodySrc = fileIds.fullbody;

  for (const step of steps) {
    const payload = { ...step.payload };
    if (
      (step.module === "cloth" || step.module === "bag" || step.module === "hat") &&
      fullbodySrc
    ) {
      payload.src_file_id = fullbodySrc;
    }

    const result = await runSseTask(step.module, payload);
    taskIds.push(result.task_id);

    if (result.result_url) {
      canvasResults[step.canvas] = result.result_url;
    }

    const nextSource = result.result_url ?? result.dst_id;
    if (nextSource && step.canvas === "fullbody") {
      fullbodySrc = nextSource;
    }
    if (nextSource) {
      canvasFileIds[step.canvas] = nextSource;
    }
  }

  return { canvasResults, canvasFileIds, task_ids: taskIds };
}

export async function generateWardrobeItem(prompt: string, slotId: string) {
  const result = await runSseTask("image-gen", { prompt, slot_id: slotId });
  return {
    ref_file_id: undefined,
    preview_url: result.result_url ?? undefined,
    ref_image_url: result.result_url ?? undefined
  };
}
