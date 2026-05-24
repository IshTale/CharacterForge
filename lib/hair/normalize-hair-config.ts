import type { HairColorPalette, HairColorSelection } from "@/types/hair";
import type { HairConfig } from "@/types/recipe";

export type LegacyHairConfig = HairConfig & {
  style?: {
    style_group_id?: string;
    style_id?: string;
    title?: string;
  };
  extension?: unknown;
  bangs?: unknown;
  volume?: unknown;
};

const DEFAULT_PALETTE: HairColorPalette = {
  color: "#3d2314",
  color_intensity: 50,
  shine_intensity: 30
};

const DEFAULT_OMBRE_BOTTOM: HairColorPalette = {
  color: "#c9a66b",
  color_intensity: 50,
  shine_intensity: 30
};

export const DEFAULT_HAIR_COLOR: HairColorSelection = {
  mode: "custom",
  pattern: { name: "full" },
  palettes: [{ ...DEFAULT_PALETTE }]
};

function migrateLegacyHexColor(value: {
  color_hex: string;
  intensity?: number;
}): HairColorSelection {
  return {
    mode: "custom",
    pattern: { name: "full" },
    palettes: [
      {
        color: value.color_hex,
        color_intensity: value.intensity ?? DEFAULT_PALETTE.color_intensity,
        shine_intensity: DEFAULT_PALETTE.shine_intensity
      }
    ]
  };
}

function normalizePalettes(
  palettes: HairColorPalette[] | undefined,
  patternName: HairColorSelection["pattern"]["name"]
): HairColorPalette[] {
  const slotCount = patternName === "ombre" ? 2 : 1;
  const source = palettes?.length ? palettes : [DEFAULT_PALETTE];
  const normalized: HairColorPalette[] = [];

  for (let index = 0; index < slotCount; index += 1) {
    const entry = source[index] ?? (index === 1 ? DEFAULT_OMBRE_BOTTOM : DEFAULT_PALETTE);
    normalized.push({
      color: entry.color ?? DEFAULT_PALETTE.color,
      color_intensity: entry.color_intensity ?? DEFAULT_PALETTE.color_intensity,
      shine_intensity: entry.shine_intensity ?? DEFAULT_PALETTE.shine_intensity
    });
  }

  return normalized;
}

function normalizeHairColor(value: unknown): HairColorSelection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("color_hex" in value && typeof (value as { color_hex: string }).color_hex === "string") {
    return migrateLegacyHexColor(value as { color_hex: string; intensity?: number });
  }

  const color = value as Partial<HairColorSelection>;
  if (!color.pattern?.name) {
    return null;
  }

  const patternName = color.pattern.name;
  const pattern =
    patternName === "ombre"
      ? {
          name: "ombre" as const,
          blend_strength: color.pattern.blend_strength ?? 50,
          line_offset: color.pattern.line_offset ?? 0,
          coloring_section: color.pattern.coloring_section ?? "top"
        }
      : { name: "full" as const };

  return {
    mode: color.mode === "preset" ? "preset" : "custom",
    preset: color.preset ?? null,
    pattern,
    palettes: normalizePalettes(color.palettes, patternName)
  };
}

/** Migrate legacy `hair.style` objects and strip removed v1 pipeline slots. */
export function normalizeHairConfig(hair: LegacyHairConfig): HairConfig {
  const {
    style: legacyStyle,
    extension: _extension,
    bangs: _bangs,
    volume: _volume,
    color,
    ...rest
  } = hair;

  let transfer = rest.transfer ?? null;
  if (!transfer && legacyStyle?.style_id) {
    transfer = {
      mode: "template",
      template_id: legacyStyle.style_id,
      title: legacyStyle.title
    };
  }

  const isLegacyV1Color =
    color &&
    typeof color === "object" &&
    "style_id" in color &&
    !("pattern" in color) &&
    !("color_hex" in color);

  const normalizedColor = isLegacyV1Color ? null : normalizeHairColor(color);

  return {
    transfer,
    color: normalizedColor,
    selected_section: rest.selected_section
  };
}

export function hairHasSelection(hair: HairConfig) {
  return Boolean(hair.transfer);
}

export function defaultHairColor(): HairColorSelection {
  return {
    mode: DEFAULT_HAIR_COLOR.mode,
    preset: null,
    pattern: { ...DEFAULT_HAIR_COLOR.pattern },
    palettes: DEFAULT_HAIR_COLOR.palettes.map((palette) => ({ ...palette }))
  };
}
