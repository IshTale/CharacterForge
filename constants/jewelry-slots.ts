export type JewelrySlotId = "ring" | "bracelet" | "watch" | "necklace";

export interface JewelrySlotDefinition {
  id: JewelrySlotId;
  title: string;
  subtitle: string;
  fileModule: string;
  sourceCanvas: "handwrist" | "headshot";
}

export const JEWELRY_SLOTS: JewelrySlotDefinition[] = [
  {
    id: "ring",
    title: "Ring",
    subtitle: "Reference photo for ring try-on (1024x1024 recommended)",
    fileModule: "ring",
    sourceCanvas: "handwrist"
  },
  {
    id: "bracelet",
    title: "Bracelet",
    subtitle: "Wrist accessory reference for bracelet try-on",
    fileModule: "bracelet",
    sourceCanvas: "handwrist"
  },
  {
    id: "watch",
    title: "Watch",
    subtitle: "Watch face and band reference",
    fileModule: "watch",
    sourceCanvas: "handwrist"
  },
  {
    id: "necklace",
    title: "Necklace",
    subtitle: "Necklace reference applied to the headshot",
    fileModule: "necklace",
    sourceCanvas: "headshot"
  }
];

export const JEWELRY_SLOT_BY_ID = Object.fromEntries(
  JEWELRY_SLOTS.map((slot) => [slot.id, slot])
) as Record<JewelrySlotId, JewelrySlotDefinition>;
