import { REGION_CATALOG } from "@/constants/makeup-catalogs";
import { legacyColorsFromEffect, normalizeColors, normalizeIntensities } from "@/lib/makeup/colors";
import type { MakeupApiEffect } from "@/types/makeup-api";
import type { MakeupConfig, MakeupEffectSelection, MakeupRegion } from "@/types/recipe";

const EFFECT_ORDER: MakeupRegion[] = [
  "skin_smooth",
  "foundation",
  "concealer",
  "blush",
  "bronzer",
  "contour",
  "highlighter",
  "eyebrows",
  "eye_shadow",
  "eye_liner",
  "eyelashes",
  "lip_color",
  "lip_liner"
];

const PATTERN_CATEGORIES = new Set<MakeupRegion>([
  "blush",
  "bronzer",
  "contour",
  "highlighter",
  "eye_shadow",
  "eye_liner",
  "eyelashes",
  "lip_liner"
]);

function resolveSelection(
  region: MakeupRegion,
  effect: MakeupEffectSelection | undefined
): MakeupEffectSelection | null {
  if (!effect) {
    return null;
  }

  const legacyColors = legacyColorsFromEffect(
    effect as MakeupEffectSelection & { color?: string }
  );
  const colorCount =
    region === "skin_smooth" ? 0 : Math.max(legacyColors?.length ?? effect.colors.length, 1);

  const colors = normalizeColors(legacyColors ?? effect.colors, colorCount);
  const colorIntensities = normalizeIntensities(
    effect.colorIntensities ??
      (effect.colorIntensity != null ? [effect.colorIntensity] : undefined),
    colorCount
  );

  return { ...effect, colors, colorIntensities };
}

function mattePalette(color: string, colorIntensity: number) {
  return { color, texture: "matte" as const, colorIntensity };
}

function buildRegionEffect(
  region: MakeupRegion,
  raw: MakeupEffectSelection | undefined
): MakeupApiEffect | null {
  const effect = resolveSelection(region, raw);
  if (!effect) {
    return null;
  }

  if (region === "skin_smooth") {
    return {
      category: "skin_smooth",
      skinSmoothStrength: effect.skinSmoothStrength ?? 50,
      skinSmoothColorIntensity: effect.skinSmoothColorIntensity ?? 45
    };
  }

  if (region === "foundation") {
    const [color] = effect.colors;
    const [intensity] = effect.colorIntensities;
    if (!color) {
      return null;
    }
    return {
      category: "foundation",
      palettes: [
        {
          color,
          colorIntensity: intensity ?? 50,
          glowIntensity: effect.glowIntensity ?? 30,
          coverageIntensity: effect.coverageIntensity ?? 60
        }
      ]
    };
  }

  if (region === "concealer") {
    const [color] = effect.colors;
    const [intensity] = effect.colorIntensities;
    if (!color) {
      return null;
    }
    return {
      category: "concealer",
      palettes: [
        {
          color,
          colorIntensity: intensity ?? 50,
          colorUnderEyeIntensity: effect.colorUnderEyeIntensity ?? 60,
          coverageLevel: effect.coverageLevel ?? 70
        }
      ]
    };
  }

  if (region === "lip_color") {
    if (!effect.pattern) {
      return null;
    }
    const palettes = effect.colors.map((color, index) => ({
      color,
      texture: "matte",
      colorIntensity: effect.colorIntensities[index] ?? 50
    }));
    if (palettes.length === 0) {
      return null;
    }
    return {
      category: "lip_color",
      shape: { name: effect.pattern },
      style: { type: "full" },
      morphology: {
        fullness: effect.lipFullness ?? 0,
        wrinkless: effect.lipWrinkless ?? 0
      },
      palettes: palettes.map((palette) => ({
        ...palette,
        gloss: 0,
        transparencyIntensity: 0
      }))
    };
  }

  if (region === "eyebrows") {
    if (!effect.pattern) {
      return null;
    }
    const [color] = effect.colors;
    const [intensity] = effect.colorIntensities;
    if (!color) {
      return null;
    }
    return {
      category: "eyebrows",
      pattern: {
        type: "shape",
        name: effect.pattern,
        curvature: effect.eyebrowCurvature ?? 0,
        thickness: effect.eyebrowThickness ?? 0,
        definition: effect.eyebrowDefinition ?? 50
      },
      palettes: [{ ...mattePalette(color, intensity ?? 50), texture: "matte" }]
    };
  }

  if (PATTERN_CATEGORIES.has(region)) {
    if (!effect.pattern) {
      return null;
    }
    const palettes = effect.colors.map((color, index) =>
      mattePalette(color, effect.colorIntensities[index] ?? 50)
    );
    if (palettes.length === 0) {
      return null;
    }

    if (region === "highlighter") {
      return {
        category: "highlighter",
        pattern: { name: effect.pattern },
        palettes: palettes.map((palette) => ({
          ...palette,
          glowIntensity: effect.glowIntensity ?? 60,
          shimmerIntensity: effect.shimmerIntensity ?? 70,
          shimmerDensity: effect.shimmerDensity ?? 50,
          shimmerSize: effect.shimmerSize ?? 40
        }))
      } as MakeupApiEffect;
    }

    if (region === "lip_liner") {
      return {
        category: "lip_liner",
        pattern: { name: effect.pattern },
        palettes: palettes.map((palette) => ({
          ...palette,
          thickness: effect.lipLinerThickness ?? 40,
          smoothness: effect.lipLinerSmoothness ?? 60
        }))
      } as MakeupApiEffect;
    }

    return {
      category: region,
      pattern: { name: effect.pattern },
      palettes
    } as MakeupApiEffect;
  }

  return null;
}

/** Builds the full makeup-vto effects[] array from studio region selections. */
export function buildMakeupEffects(makeup: MakeupConfig): MakeupApiEffect[] {
  const regionEffects = makeup.effects ?? {};
  const built: MakeupApiEffect[] = [];

  for (const region of EFFECT_ORDER) {
    const apiEffect = buildRegionEffect(region, regionEffects[region]);
    if (apiEffect) {
      built.push(apiEffect);
    }
  }

  return built;
}

export function isConfiguredRegion(region: MakeupRegion, effect?: MakeupEffectSelection): boolean {
  if (!effect) {
    return false;
  }
  if (region === "skin_smooth") {
    return true;
  }
  if (REGION_CATALOG[region]) {
    return Boolean(effect.pattern);
  }
  return effect.colors.length > 0;
}
