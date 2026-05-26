"use client";

import ColorPicker from "@/components/studio/makeup/ColorPicker";
import IntensitySlider from "@/components/studio/makeup/IntensitySlider";
import { hairColorPresetsForPattern } from "@/constants/hair-color-presets";
import { defaultHairColor } from "@/lib/hair/normalize-hair-config";
import type { HairColorPatternName, HairColorSelection } from "@/types/hair";

interface HairColorPanelProps {
  value: HairColorSelection;
  onChange: (color: HairColorSelection) => void;
}

const PATTERN_OPTIONS: { id: HairColorPatternName; label: string }[] = [
  { id: "full", label: "Full" },
  { id: "ombre", label: "Ombre" }
];

function paletteLabels(pattern: HairColorPatternName): string[] {
  return pattern === "ombre" ? ["Top color", "Bottom color"] : ["Hair color"];
}

export default function HairColorPanel({ value, onChange }: HairColorPanelProps) {
  const presets = hairColorPresetsForPattern(value.pattern.name);

  const setPattern = (name: HairColorPatternName) => {
    const defaults = defaultHairColor();
    const ombreBottom = {
      color: "#c9a66b",
      color_intensity: 50,
      shine_intensity: 30
    };
    const nextPalettes =
      name === "ombre"
        ? [value.palettes[0] ?? defaults.palettes[0], value.palettes[1] ?? ombreBottom]
        : [value.palettes[0] ?? defaults.palettes[0]];
    const nextPattern =
      name === "ombre"
        ? {
            name: "ombre" as const,
            blend_strength: value.pattern.blend_strength ?? 50,
            line_offset: value.pattern.line_offset ?? 0,
            coloring_section: "top" as const
          }
        : { name: "full" as const };
    const nextPresets = hairColorPresetsForPattern(name);

    onChange({
      ...value,
      mode: value.mode === "preset" ? "preset" : "custom",
      preset:
        value.mode === "preset"
          ? nextPresets.includes(value.preset ?? "")
            ? value.preset
            : (nextPresets[0] ?? null)
          : null,
      pattern: nextPattern,
      palettes: nextPalettes
    });
  };

  const setMode = (mode: HairColorSelection["mode"]) => {
    if (mode === "preset") {
      onChange({
        ...value,
        mode: "preset",
        preset: presets[0] ?? null
      });
      return;
    }
    onChange({
      ...value,
      mode: "custom",
      preset: null
    });
  };

  const setPreset = (preset: string) => {
    onChange({ ...value, mode: "preset", preset });
  };

  const setPaletteAt = (index: number, patch: Partial<HairColorSelection["palettes"][number]>) => {
    const palettes = [...value.palettes];
    palettes[index] = { ...palettes[index], ...patch };
    onChange({ ...value, mode: "custom", preset: null, palettes });
  };

  const setOmbreField = (
    patch: Partial<{ blend_strength: number; line_offset: number; coloring_section: "top" }>
  ) => {
    if (value.pattern.name !== "ombre") {
      return;
    }
    onChange({
      ...value,
      mode: "custom",
      preset: null,
      pattern: {
        name: "ombre",
        blend_strength: patch.blend_strength ?? value.pattern.blend_strength ?? 50,
        line_offset: patch.line_offset ?? value.pattern.line_offset ?? 0,
        coloring_section: patch.coloring_section ?? value.pattern.coloring_section ?? "top"
      }
    });
  };

  const labels = paletteLabels(value.pattern.name);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-plum-700/70">Color style</p>
        <div className="flex flex-wrap gap-2">
          {PATTERN_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPattern(option.id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                value.pattern.name === option.id
                  ? "border-magenta-500 bg-magenta-500 text-white"
                  : "border-mint-300 bg-white/50 text-plum-700 hover:border-magenta-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-plum-700/70">Source</p>
        <div className="flex flex-wrap gap-2">
          {(["custom", "preset"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={`rounded-full border px-3 py-1 text-xs ${
                value.mode === mode
                  ? "border-magenta-500 bg-magenta-500 text-white"
                  : "border-mint-300 bg-white/50 text-plum-700 hover:border-magenta-400"
              }`}
            >
              {mode === "custom" ? "Custom colors" : "Preset"}
            </button>
          ))}
        </div>
      </div>

      {value.mode === "preset" ? (
        <div className="space-y-2 rounded-xl border border-mint-200 bg-mint-50/50 p-3">
          <p className="text-xs font-medium text-plum-800">Preset</p>
          <select
            value={value.preset ?? ""}
            onChange={(event) => setPreset(event.target.value)}
            className="beauty-input w-full"
          >
            {presets.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          {value.palettes.map((palette, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-mint-200 bg-mint-50/50 p-3">
              <p className="text-xs font-medium text-plum-800">{labels[index]}</p>
              <ColorPicker
                value={palette.color}
                onChange={(color) => setPaletteAt(index, { color })}
              />
              <div>
                <p className="mb-1 text-xs text-plum-700/70">Color intensity</p>
                <IntensitySlider
                  value={palette.color_intensity}
                  onChange={(color_intensity) => setPaletteAt(index, { color_intensity })}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-plum-700/70">Shine intensity</p>
                <IntensitySlider
                  value={palette.shine_intensity}
                  onChange={(shine_intensity) => setPaletteAt(index, { shine_intensity })}
                />
              </div>
            </div>
          ))}

          {value.pattern.name === "ombre" && (
            <div className="space-y-3 rounded-xl border border-mint-200 bg-mint-50/50 p-3">
              <p className="text-xs font-medium text-plum-800">Ombre blend</p>
              <div>
                <p className="mb-1 text-xs text-plum-700/70">Blend strength</p>
                <IntensitySlider
                  value={value.pattern.blend_strength ?? 50}
                  onChange={(blend_strength) => setOmbreField({ blend_strength })}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-plum-700/70">
                  Line offset ({value.pattern.line_offset?.toFixed(2) ?? "0.00"})
                </p>
                <input
                  type="range"
                  min={-99}
                  max={99}
                  value={Math.round((value.pattern.line_offset ?? 0) * 100)}
                  onChange={(event) =>
                    setOmbreField({ line_offset: Number(event.target.value) / 100 })
                  }
                  className="w-full"
                />
                <p className="mt-1 text-[10px] text-plum-700/60">
                  Positive pushes top color lower; negative pushes bottom color higher.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
