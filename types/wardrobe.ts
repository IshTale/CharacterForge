export type WardrobeSlotId = "top" | "bottom" | "hat" | "shoes" | "bag";

export type WardrobeItemSource = "generate" | "upload";

export interface WardrobeSlotState {
  source: WardrobeItemSource | null;
  prompt?: string;
  ref_file_id?: string;
  ref_image_url?: string;
  preview_url?: string;
}

export interface WardrobeConfig {
  gender: "female" | "male";
  top: WardrobeSlotState;
  bottom: WardrobeSlotState;
  hat: WardrobeSlotState;
  shoes: WardrobeSlotState;
  bag: WardrobeSlotState;
}

export function createEmptyWardrobeSlot(): WardrobeSlotState {
  return { source: null };
}

export function createDefaultWardrobeConfig(): WardrobeConfig {
  return {
    gender: "female",
    top: createEmptyWardrobeSlot(),
    bottom: createEmptyWardrobeSlot(),
    hat: createEmptyWardrobeSlot(),
    shoes: createEmptyWardrobeSlot(),
    bag: createEmptyWardrobeSlot()
  };
}

export function isWardrobeSlotReady(slot: WardrobeSlotState): boolean {
  return Boolean(slot.ref_file_id || slot.ref_image_url);
}
