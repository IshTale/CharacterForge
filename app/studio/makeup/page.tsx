"use client";

import { useEffect, useMemo, useState } from "react";
import ColorCategoryFilter from "@/components/studio/makeup/ColorCategoryFilter";
import ColorPicker from "@/components/studio/makeup/ColorPicker";
import FaceRegionMap from "@/components/studio/makeup/FaceRegionMap";
import IntensitySlider from "@/components/studio/makeup/IntensitySlider";
import MakeupEffectPanel from "@/components/studio/makeup/MakeupEffectPanel";
import PatternSelector from "@/components/studio/makeup/PatternSelector";
import { REGION_CATALOG } from "@/constants/makeup-catalogs";
import { buildMakeupEffects } from "@/lib/makeup/build-effects";
import { legacyColorsFromEffect, normalizeColors, normalizeIntensities } from "@/lib/makeup/colors";
import { useMakeupPatterns } from "@/lib/makeup/use-makeup-patterns";
import { useCharacterForgeStore } from "@/store/characterforge.store";
import type { MakeupPatternEntry } from "@/types/makeup";
import type { MakeupEffectSelection, MakeupRegion } from "@/types/recipe";

const REGION_LABEL: Record<MakeupRegion, string> = {
  foundation: "Foundation",
  concealer: "Concealer",
  blush: "Blush",
  bronzer: "Bronzer",
  contour: "Contour",
  highlighter: "Highlighter",
  eyebrows: "Eyebrows",
  eye_shadow: "Eye Shadow",
  eye_liner: "Eye Liner",
  eyelashes: "Eyelashes",
  lip_color: "Lip Color",
  lip_liner: "Lip Liner",
  skin_smooth: "Skin Smooth"
};

function defaultEffect(region: MakeupRegion): MakeupEffectSelection {
  if (region === "skin_smooth") {
    return {
      pattern: "",
      colors: [],
      colorIntensities: [],
      skinSmoothStrength: 50,
      skinSmoothColorIntensity: 45
    };
  }

  return {
    pattern: "",
    colors: normalizeColors(undefined, 1),
    colorIntensities: normalizeIntensities(undefined, 1)
  };
}

function resolveEffect(
  region: MakeupRegion,
  effect: MakeupEffectSelection | undefined
): MakeupEffectSelection {
  const base = defaultEffect(region);
  if (!effect) {
    return base;
  }

  const legacyColors = legacyColorsFromEffect(
    effect as MakeupEffectSelection & { color?: string }
  );
  const colorCount =
    region === "skin_smooth" ? 0 : Math.max(legacyColors?.length ?? effect.colors.length, 1);

  return {
    ...base,
    ...effect,
    colors: normalizeColors(legacyColors ?? effect.colors, colorCount),
    colorIntensities: normalizeIntensities(
      effect.colorIntensities ??
        (effect.colorIntensity != null ? [effect.colorIntensity] : undefined),
      colorCount
    )
  };
}

function uniquePatternCategories(patterns: MakeupPatternEntry[]): string[] {
  const categories = new Set(patterns.map((pattern) => pattern.category));
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

export default function MakeupPage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const selectedRegion = recipe.makeup.selected_region ?? "foundation";
  const selectedEffect = resolveEffect(
    selectedRegion,
    recipe.makeup.effects?.[selectedRegion]
  );

  const { patterns, loading, error, hasCatalog } = useMakeupPatterns(selectedRegion);
  const [colorCategory, setColorCategory] = useState("all");

  useEffect(() => {
    setColorCategory("all");
  }, [selectedRegion]);

  const patternCategories = useMemo(() => uniquePatternCategories(patterns), [patterns]);

  const filteredPatterns = useMemo(() => {
    if (colorCategory === "all") {
      return patterns;
    }
    return patterns.filter((pattern) => pattern.category === colorCategory);
  }, [patterns, colorCategory]);

  const selectedPattern = useMemo(
    () => patterns.find((pattern) => pattern.label === selectedEffect.pattern),
    [patterns, selectedEffect.pattern]
  );

  const colorSlotCount = hasCatalog
    ? selectedPattern?.colorNum ?? 1
    : selectedRegion === "skin_smooth"
      ? 0
      : 1;
  const apiConsideredRegions = useMemo(
    () => new Set(buildMakeupEffects(recipe.makeup).map((effect) => effect.category as MakeupRegion)),
    [recipe.makeup]
  );
  const hasSelectedRegionEffect = Boolean(recipe.makeup.effects?.[selectedRegion]);

  const patternPanelTitle =
    selectedRegion === "lip_color"
      ? "Lip Shape"
      : REGION_CATALOG[selectedRegion]
        ? "Pattern"
        : null;

  const setRegionValue = (region: MakeupRegion, patch: Partial<MakeupEffectSelection>) => {
    const current = resolveEffect(region, recipe.makeup.effects?.[region]);
    updateRecipe((state) => ({
      ...state,
      makeup: {
        ...state.makeup,
        selected_region: region,
        effects: {
          ...state.makeup.effects,
          [region]: {
            ...current,
            ...patch
          }
        }
      }
    }));
    markDirty("makeup");
  };

  const handlePatternSelect = (pattern: MakeupPatternEntry) => {
    const colorNum = pattern.colorNum ?? 1;
    setRegionValue(selectedRegion, {
      pattern: pattern.label,
      colors: normalizeColors(selectedEffect.colors, colorNum),
      colorIntensities: normalizeIntensities(selectedEffect.colorIntensities, colorNum)
    });
  };

  const setColorAtIndex = (index: number, color: string) => {
    const next = [...selectedEffect.colors];
    next[index] = color;
    setRegionValue(selectedRegion, { colors: next });
  };

  const setIntensityAtIndex = (index: number, intensity: number) => {
    const next = [...selectedEffect.colorIntensities];
    next[index] = intensity;
    setRegionValue(selectedRegion, { colorIntensities: next });
  };

  const handleApply = async () => {
    setApplyError(null);
    setApplying(true);
    try {
      await triggerRender(["makeup"]);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply makeup.");
    } finally {
      setApplying(false);
    }
  };

  const clearRegion = (region: MakeupRegion) => {
    updateRecipe((state) => {
      const nextEffects = { ...(state.makeup.effects ?? {}) };
      delete nextEffects[region];
      return {
        ...state,
        makeup: {
          ...state.makeup,
          effects: nextEffects
        }
      };
    });
    markDirty("makeup");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-plum-900">Makeup Studio</h1>
      <FaceRegionMap
        selectedRegion={selectedRegion}
        consideredRegions={Array.from(apiConsideredRegions)}
        onSelect={(region) => {
          updateRecipe((state) => ({
            ...state,
            makeup: {
              ...state.makeup,
              selected_region: region,
              effects: {
                ...state.makeup.effects,
                [region]: resolveEffect(region, state.makeup.effects?.[region])
              }
            }
          }));
          markDirty("makeup");
        }}
      />

      <MakeupEffectPanel
        title={`${REGION_LABEL[selectedRegion]} Options`}
        headerAction={
          <button
            type="button"
            onClick={() => clearRegion(selectedRegion)}
            disabled={!hasSelectedRegionEffect}
            className="text-xs font-medium text-magenta-700 transition hover:text-magenta-800 disabled:cursor-not-allowed disabled:text-plum-400/80"
          >
            Clear section
          </button>
        }
      >
        <div className="space-y-4">
          {hasCatalog && (
            <div className="space-y-3">
              {patternCategories.length > 1 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-plum-700/70">Style group</p>
                  <ColorCategoryFilter
                    categories={patternCategories}
                    selected={colorCategory}
                    onSelect={setColorCategory}
                  />
                </div>
              )}

              {patternPanelTitle && (
                <div>
                  <p className="mb-2 text-xs font-medium text-plum-700/70">{patternPanelTitle}</p>
                  {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
                  <PatternSelector
                    patterns={filteredPatterns}
                    selected={selectedEffect.pattern}
                    onSelect={handlePatternSelect}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          )}

          {selectedRegion === "skin_smooth" ? (
            <>
              <div>
                <p className="mb-1 text-xs text-plum-700/70">Smooth strength</p>
                <IntensitySlider
                  value={selectedEffect.skinSmoothStrength ?? 50}
                  onChange={(skinSmoothStrength) =>
                    setRegionValue(selectedRegion, { skinSmoothStrength })
                  }
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-plum-700/70">Color intensity</p>
                <IntensitySlider
                  value={selectedEffect.skinSmoothColorIntensity ?? 45}
                  onChange={(skinSmoothColorIntensity) =>
                    setRegionValue(selectedRegion, { skinSmoothColorIntensity })
                  }
                />
              </div>
            </>
          ) : (
            colorSlotCount > 0 && (
              <div className="space-y-4">
                {Array.from({ length: colorSlotCount }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-xl border border-mint-200 bg-mint-50/50 p-3"
                  >
                    <p className="text-xs font-medium text-plum-800">
                      {colorSlotCount > 1 ? `Color ${index + 1}` : "Color"}
                    </p>
                    <ColorPicker
                      value={selectedEffect.colors[index] ?? "#e27f7f"}
                      onChange={(color) => setColorAtIndex(index, color)}
                    />
                    <div>
                      <p className="mb-1 text-xs text-plum-700/70">Intensity</p>
                      <IntensitySlider
                        value={selectedEffect.colorIntensities[index] ?? 50}
                        onChange={(intensity) => setIntensityAtIndex(index, intensity)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </MakeupEffectPanel>

      {applyError && <p className="text-sm text-red-400">{applyError}</p>}

      <button
        type="button"
        onClick={handleApply}
        disabled={applying}
        className="beauty-primary"
      >
        {applying ? "Applying…" : "Apply Makeup"}
      </button>
    </div>
  );
}
