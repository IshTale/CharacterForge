"use client";

import ColorPicker from "@/components/studio/makeup/ColorPicker";
import FaceRegionMap from "@/components/studio/makeup/FaceRegionMap";
import MakeupEffectPanel from "@/components/studio/makeup/MakeupEffectPanel";
import PatternSelector from "@/components/studio/makeup/PatternSelector";
import { useCharacterForgeStore } from "@/store/characterforge.store";
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

const REGION_PATTERNS: Record<MakeupRegion, string[]> = {
  foundation: ["even-matte", "natural-dewy", "photo-ready"],
  concealer: ["under-eye-soft", "full-coverage", "bright-focus"],
  blush: ["1color1", "2colors6", "2colors1"],
  bronzer: ["soft-warm", "sun-kissed", "deep-sculpt"],
  contour: ["cheek-lift", "jawline", "full-contour"],
  highlighter: ["liquid-glow", "powder-sheen", "glass-skin"],
  eyebrows: ["soft-arch", "defined-arch", "feathered"],
  eye_shadow: ["mono-smoke", "cut-crease", "halo-eye"],
  eye_liner: ["classic-wing", "fox-eye", "graphic-line"],
  eyelashes: ["natural", "volume", "dramatic"],
  lip_color: ["matte-solid", "glossy-plump", "ombre"],
  lip_liner: ["sharp-outline", "soft-outline", "overline"],
  skin_smooth: ["light-smooth", "balanced-smooth", "full-smooth"]
};

const REGION_DESIGNS: Record<MakeupRegion, string[]> = {
  foundation: ["neutral", "warm", "cool"],
  concealer: ["bright", "match-tone", "spot-correct"],
  blush: ["round", "lifted", "draped"],
  bronzer: ["temple-focus", "cheek-focus", "full-warmth"],
  contour: ["subtle", "sculpted", "editorial"],
  highlighter: ["cheekbone", "bridge", "all-points"],
  eyebrows: ["natural-hair", "powder-fill", "laminated"],
  eye_shadow: ["single-tone", "gradient", "sparkle"],
  eye_liner: ["thin", "cat-eye", "double-wing"],
  eyelashes: ["wispy", "cat-lash", "full-fan"],
  lip_color: ["full-fill", "gradient-center", "stain"],
  lip_liner: ["defined-edge", "soft-blend", "plump-edge"],
  skin_smooth: ["texture-retain", "balanced", "airbrush"]
};

function defaultEffect(region: MakeupRegion): MakeupEffectSelection {
  return {
    pattern: REGION_PATTERNS[region][0],
    color: "#e27f7f",
    design: REGION_DESIGNS[region][0]
  };
}

export default function MakeupPage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);
  const selectedRegion = recipe.makeup.selected_region ?? "foundation";
  const selectedEffect = recipe.makeup.effects?.[selectedRegion] ?? defaultEffect(selectedRegion);

  const setRegionValue = (region: MakeupRegion, patch: Partial<MakeupEffectSelection>) => {
    const current = recipe.makeup.effects?.[region] ?? defaultEffect(region);
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

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Makeup Studio</h1>
      <FaceRegionMap
        selectedRegion={selectedRegion}
        onSelect={(region) => {
          updateRecipe((state) => ({
            ...state,
            makeup: {
              ...state.makeup,
              selected_region: region,
              effects: {
                ...state.makeup.effects,
                [region]: state.makeup.effects?.[region] ?? defaultEffect(region)
              }
            }
          }));
          markDirty("makeup");
        }}
      />

      <MakeupEffectPanel title={`${REGION_LABEL[selectedRegion]} Options`}>
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs text-gray-400">Design Pattern</p>
            <PatternSelector
              patterns={REGION_PATTERNS[selectedRegion]}
              selected={selectedEffect.pattern}
              onSelect={(pattern) => setRegionValue(selectedRegion, { pattern })}
            />
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-400">Application Design</p>
            <PatternSelector
              patterns={REGION_DESIGNS[selectedRegion]}
              selected={selectedEffect.design}
              onSelect={(design) => setRegionValue(selectedRegion, { design })}
            />
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-400">Color</p>
            <ColorPicker
              value={selectedEffect.color}
              onChange={(color) => setRegionValue(selectedRegion, { color })}
            />
          </div>
        </div>
      </MakeupEffectPanel>

      <button
        type="button"
        onClick={() => triggerRender(["makeup"])}
        className="rounded bg-white px-4 py-2 text-black"
      >
        Apply Makeup
      </button>
    </div>
  );
}
