import type { HairConfig } from "@/types/recipe";

export type HairSection = "hairstyle" | "color";
export type HairPipelineStage = "transfer" | "color";

export const HAIR_PIPELINE_ORDER: HairPipelineStage[] = ["transfer", "color"];

export const HAIR_SECTION_LABEL: Record<HairSection, string> = {
  hairstyle: "Hairstyle",
  color: "Hair Color"
};
