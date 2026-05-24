import type { HairColorPatternName } from "@/types/hair";

export const HAIR_COLOR_FULL_PRESETS = [
  "Jet Black",
  "Chocolate Brown",
  "Honey Blonde",
  "Platinum Blonde",
  "Ash Gray",
  "Rose Gold",
  "Burgundy",
  "Copper Red",
  "Lavender",
  "Teal Blue"
] as const;

export const HAIR_COLOR_OMBRE_PRESETS = [
  "Dark Brown/Caramel Blonde",
  "Jet Black/Silver Gray",
  "Ash Brown/Lavender",
  "Rose Gold/Peach Blonde",
  "Burgundy/Magenta Pink",
  "Deep Blue/Teal Green",
  "Plum Purple/Pastel Lilac",
  "Copper Red/Golden Blonde",
  "Dark Gray/Ice Blonde",
  "Midnight Blue/Denim Blue"
] as const;

export type HairColorFullPreset = (typeof HAIR_COLOR_FULL_PRESETS)[number];
export type HairColorOmbrePreset = (typeof HAIR_COLOR_OMBRE_PRESETS)[number];

export function hairColorPresetsForPattern(
  pattern: HairColorPatternName
): readonly string[] {
  return pattern === "ombre" ? HAIR_COLOR_OMBRE_PRESETS : HAIR_COLOR_FULL_PRESETS;
}
