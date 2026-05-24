/** Perfect Corp makeup-vto effect objects (effects[] payload). */

export interface MakeupPaletteBase {
  color: string;
  colorIntensity: number;
  texture?: string;
}

export type MakeupApiEffect =
  | SkinSmoothEffect
  | FoundationEffect
  | ConcealerEffect
  | PatternMakeupEffect
  | EyebrowsEffect
  | LipColorEffect;

export interface SkinSmoothEffect {
  category: "skin_smooth";
  skinSmoothStrength: number;
  skinSmoothColorIntensity: number;
}

export interface FoundationEffect {
  category: "foundation";
  palettes: Array<{
    color: string;
    colorIntensity: number;
    glowIntensity: number;
    coverageIntensity: number;
  }>;
}

export interface ConcealerEffect {
  category: "concealer";
  palettes: Array<{
    color: string;
    colorIntensity: number;
    colorUnderEyeIntensity: number;
    coverageLevel: number;
  }>;
}

export interface PatternMakeupEffect {
  category:
    | "blush"
    | "bronzer"
    | "contour"
    | "highlighter"
    | "eye_shadow"
    | "eye_liner"
    | "eyelashes"
    | "lip_liner";
  pattern: { name: string };
  palettes: MakeupPaletteBase[];
}

export interface EyebrowsEffect {
  category: "eyebrows";
  pattern: {
    type: "shape";
    name: string;
    curvature: number;
    thickness: number;
    definition: number;
  };
  palettes: Array<MakeupPaletteBase & { texture: string }>;
}

export interface LipColorEffect {
  category: "lip_color";
  shape: { name: string };
  style: { type: "full" };
  morphology: { fullness: number; wrinkless: number };
  palettes: Array<
    MakeupPaletteBase & {
      texture: string;
      gloss: number;
      transparencyIntensity: number;
    }
  >;
}

export interface MakeupVtoTaskPayload {
  version: "1.0";
  src_file_id: string;
  effects: MakeupApiEffect[];
}
