import type { CanvasKey } from "@/types/canvas";
import type { WardrobeSlotId } from "@/types/wardrobe";

export interface WardrobeSlotDefinition {
  id: WardrobeSlotId;
  title: string;
  subtitle: string;
  fileModule: string;
  tryOnModule: string;
  sourceCanvas: CanvasKey;
  garmentCategory?: "upper_body" | "lower_body";
  placeholder: string;
}

export const WARDROBE_SLOTS: WardrobeSlotDefinition[] = [
  {
    id: "top",
    title: "Top",
    subtitle: "Shirts, jackets, and upper-body garments",
    fileModule: "cloth",
    tryOnModule: "cloth",
    sourceCanvas: "fullbody",
    garmentCategory: "upper_body",
    placeholder: "Cyberpunk leather jacket with neon blue accents, front view"
  },
  {
    id: "bottom",
    title: "Bottom",
    subtitle: "Pants, skirts, and lower-body garments",
    fileModule: "cloth",
    tryOnModule: "cloth",
    sourceCanvas: "fullbody",
    garmentCategory: "lower_body",
    placeholder: "High-waisted black cargo pants, front view"
  },
  {
    id: "hat",
    title: "Hat",
    subtitle: "Headwear applied to your headshot",
    fileModule: "hat",
    tryOnModule: "hat",
    sourceCanvas: "headshot",
    placeholder: "Wide-brim witch hat with silver buckle, product photo"
  },
  {
    id: "shoes",
    title: "Shoes",
    subtitle: "Footwear applied to your feet photo",
    fileModule: "shoes",
    tryOnModule: "shoes",
    sourceCanvas: "feet",
    placeholder: "Platform combat boots with buckles, studio photo"
  },
  {
    id: "bag",
    title: "Bag",
    subtitle: "Handbags and shoulder bags on full body",
    fileModule: "bag",
    tryOnModule: "bag",
    sourceCanvas: "fullbody",
    placeholder: "Small crossbody bag with chain strap, white background"
  }
];

export const WARDROBE_SLOT_BY_ID = Object.fromEntries(
  WARDROBE_SLOTS.map((slot) => [slot.id, slot])
) as Record<WardrobeSlotId, WardrobeSlotDefinition>;

export const CLOTHING_SLOTS: WardrobeSlotId[] = ["top", "bottom"];
export const ACCESSORY_SLOTS: WardrobeSlotId[] = ["hat", "shoes", "bag"];
