"use client";

import { runSseTask } from "@/lib/api/sse-task-client";
import {
  buildJewelryPipelineSteps,
  validateJewelryPipeline
} from "@/lib/jewelry/build-pipeline";
import type { CanvasKey } from "@/types/canvas";
import type { JewelryConfig } from "@/types/recipe";

export interface JewelryPipelineResult {
  canvasResults: Partial<Record<CanvasKey, string | null>>;
  canvasFileIds: Partial<Record<CanvasKey, string | null>>;
  task_ids: string[];
}

export async function runJewelryPipeline(
  jewelry: JewelryConfig,
  fileIds: { handwrist: string | null; headshot: string | null }
): Promise<JewelryPipelineResult> {
  const validationError = validateJewelryPipeline(jewelry, fileIds);
  if (validationError) {
    throw new Error(validationError);
  }

  const steps = buildJewelryPipelineSteps(jewelry, fileIds);
  const canvasResults: Partial<Record<CanvasKey, string | null>> = {};
  const canvasFileIds: Partial<Record<CanvasKey, string | null>> = {};
  const taskIds: string[] = [];

  let handSrc = fileIds.handwrist;
  let headSrc = fileIds.headshot;

  for (const step of steps) {
    const payload = { ...step.payload };
    if (step.canvas === "handwrist" && handSrc) {
      payload.src_file_id = handSrc;
    }
    if (step.canvas === "headshot" && headSrc) {
      payload.src_file_id = headSrc;
    }

    const result = await runSseTask(step.module, payload);
    taskIds.push(result.task_id);

    if (result.result_url) {
      canvasResults[step.canvas] = result.result_url;
    }

    const nextSource = result.result_url ?? result.dst_id;
    if (nextSource) {
      canvasFileIds[step.canvas] = nextSource;
      if (step.canvas === "handwrist") {
        handSrc = nextSource;
      }
      if (step.canvas === "headshot") {
        headSrc = nextSource;
      }
    }
  }

  return { canvasResults, canvasFileIds, task_ids: taskIds };
}
