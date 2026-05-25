import type { CanvasKey } from "@/types/canvas";
import type { WardrobeConfig, WardrobeSlotId, WardrobeSlotState } from "@/types/wardrobe";
import { WARDROBE_SLOT_BY_ID } from "@/constants/wardrobe-slots";
import { isWardrobeSlotReady } from "@/types/wardrobe";

export interface WardrobePipelineStep {
  slotId: WardrobeSlotId;
  module: string;
  canvas: CanvasKey;
  label: string;
  payload: Record<string, unknown>;
}

export interface WardrobeFileIds {
  headshot: string | null;
  fullbody: string | null;
}

function refForSlot(slot: WardrobeSlotState): { ref_file_id?: string; ref_file_url?: string } {
  if (slot.ref_file_id) {
    return { ref_file_id: slot.ref_file_id };
  }
  if (slot.ref_image_url) {
    return { ref_file_url: slot.ref_image_url };
  }
  return {};
}

export function buildWardrobePipelineSteps(
  wardrobe: WardrobeConfig,
  fileIds: WardrobeFileIds
): WardrobePipelineStep[] {
  const gender = wardrobe.gender ?? "female";
  const steps: WardrobePipelineStep[] = [];

  const clothingOrder: WardrobeSlotId[] = ["top", "bottom"];
  for (const slotId of clothingOrder) {
    const slot = wardrobe[slotId];
    const definition = WARDROBE_SLOT_BY_ID[slotId];
    if (!isWardrobeSlotReady(slot) || !fileIds.fullbody) {
      continue;
    }
    steps.push({
      slotId,
      module: definition.tryOnModule,
      canvas: definition.sourceCanvas,
      label: definition.title,
      payload: {
        src_file_id: fileIds.fullbody,
        ...refForSlot(slot),
        garment_category: definition.garmentCategory,
        gender,
        change_shoes: false
      }
    });
  }

  return steps;
}

export function validateWardrobePipeline(
  wardrobe: WardrobeConfig,
  fileIds: WardrobeFileIds
): string | null {
  const hasClothingSlot =
    isWardrobeSlotReady(wardrobe.top) || isWardrobeSlotReady(wardrobe.bottom);

  if (!hasClothingSlot) {
    return "Configure at least one clothing item before applying.";
  }

  if (!fileIds.fullbody) {
    return "Upload a full-body photo before applying clothing.";
  }

  return null;
}
