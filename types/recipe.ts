import type { HairColorSelection, HairTransferSelection } from "@/types/hair";
import type { MakeupApiEffect } from "@/types/makeup-api";
import type { NailsConfig } from "@/types/nails";
import type { WardrobeConfig } from "@/types/wardrobe";

export type { NailsConfig, NailFinger, NailFingerStyle, NailShape, NailTexture } from "@/types/nails";
export type {
  HairCatalogStyle,
  HairStyleGroup,
  HairColorSelection,
  HairTransferSelection,
  HairTransferTemplate
} from "@/types/hair";

export type { WardrobeConfig, WardrobeSlotId, WardrobeSlotState } from "@/types/wardrobe";

export interface MakeupConfig {
  type: "custom" | "preset";
  color_hex?: string;
  intensity?: number;
  selected_region?: MakeupRegion;
  /** Studio UI state keyed by face region. */
  effects?: Partial<Record<MakeupRegion, MakeupEffectSelection>>;
  /** Last-built makeup-vto payload (synced on apply). */
  api_effects?: MakeupApiEffect[];
}

export type MakeupRegion =
  | "foundation"
  | "concealer"
  | "blush"
  | "bronzer"
  | "contour"
  | "highlighter"
  | "eyebrows"
  | "eye_shadow"
  | "eye_liner"
  | "eyelashes"
  | "lip_color"
  | "lip_liner"
  | "skin_smooth";

export interface MakeupEffectSelection {
  /** Pattern or shape label from the Perfect Corp catalog (e.g. 2colors6, plump). */
  pattern: string;
  /** One hex per palette slot; length must match the selected pattern's colorNum when applicable. */
  colors: string[];
  /** Per-palette colorIntensity (0–100), aligned with `colors`. */
  colorIntensities: number[];
  /** @deprecated Use colorIntensities */
  colorIntensity?: number;
  skinSmoothStrength?: number;
  skinSmoothColorIntensity?: number;
  glowIntensity?: number;
  coverageIntensity?: number;
  colorUnderEyeIntensity?: number;
  coverageLevel?: number;
  shimmerIntensity?: number;
  shimmerDensity?: number;
  shimmerSize?: number;
  lipFullness?: number;
  lipWrinkless?: number;
  lipLinerThickness?: number;
  lipLinerSmoothness?: number;
  eyebrowCurvature?: number;
  eyebrowThickness?: number;
  eyebrowDefinition?: number;
}

export interface HairConfig {
  /** v2.1 hair-transfer: template or custom reference photo */
  transfer: HairTransferSelection | null;
  /** Custom hair color (hex + intensity) */
  color: HairColorSelection | null;
  /** Active studio section in the UI */
  selected_section?: "hairstyle" | "color";
}

export interface JewelryConfig {
  rings: Array<{ finger: string; ref_image_url: string }>;
  bracelets: Array<{ wrist: "left" | "right"; ref_image_url: string }>;
  watch: { wrist: "left" | "right"; ref_image_url: string } | null;
  necklace: { ref_image_url: string } | null;
}

export interface Recipe {
  recipe_id?: string;
  schema_version: "1.0";
  created_at: string;
  title?: string;
  wardrobe: WardrobeConfig;
  makeup: MakeupConfig;
  hair: HairConfig;
  nails: NailsConfig;
  jewelry: JewelryConfig;
}
