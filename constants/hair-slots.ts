import type { HairConfig } from "@/types/recipe";

export type HairPipelineStage = "transfer";

export const HAIR_PIPELINE_ORDER: HairPipelineStage[] = ["transfer"];

export const HAIR_PIPELINE_LABEL: Record<HairPipelineStage, string> = {
  transfer: "Hairstyle"
};
