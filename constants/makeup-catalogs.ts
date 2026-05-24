import type { MakeupCatalogConfig } from "@/types/makeup";
import type { MakeupRegion } from "@/types/recipe";

/** Maps studio regions to Perfect Corp catalog JSON (patterns/*.json or shapes/*.json). */
export const REGION_CATALOG: Partial<Record<MakeupRegion, MakeupCatalogConfig>> = {
  blush: { slug: "blush", kind: "patterns" },
  bronzer: { slug: "bronzer", kind: "patterns" },
  contour: { slug: "contour", kind: "patterns" },
  highlighter: { slug: "highlighter", kind: "patterns" },
  eyebrows: { slug: "eyebrows", kind: "patterns" },
  eye_shadow: { slug: "eyeshadow", kind: "patterns" },
  eye_liner: { slug: "eyeliner", kind: "patterns" },
  eyelashes: { slug: "eyelashes", kind: "patterns" },
  lip_color: { slug: "lipshape", kind: "shapes" },
  lip_liner: { slug: "lipliner", kind: "patterns" }
};

export const REGIONS_WITHOUT_CATALOG: MakeupRegion[] = [
  "foundation",
  "concealer",
  "skin_smooth"
];

export const DEFAULT_MAKEUP_COLORS = [
  "#e27f7f",
  "#c0392b",
  "#8b0000",
  "#4b0082",
  "#ffd700"
] as const;
