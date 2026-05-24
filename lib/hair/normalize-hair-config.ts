import type { HairColorSelection } from "@/types/hair";
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

const DEFAULT_HAIR_COLOR: HairColorSelection = {
  color_hex: "#3d2314",
  intensity: 50
};

function isLegacyV1Color(value: unknown): value is {
  style_group_id?: string;
  style_id?: string;
} {
  return Boolean(value && typeof value === "object" && "style_id" in value);
}

function normalizeHairColor(value: unknown): HairColorSelection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("color_hex" in value && typeof (value as HairColorSelection).color_hex === "string") {
    const color = value as HairColorSelection;
    return {
      color_hex: color.color_hex,
      intensity: color.intensity ?? DEFAULT_HAIR_COLOR.intensity
    };
  }

  return null;
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

  const normalizedColor = isLegacyV1Color(color) ? null : normalizeHairColor(color);

  return {
    transfer,
    color: normalizedColor,
    selected_section: rest.selected_section
  };
}

export function hairHasSelection(hair: HairConfig) {
  return Boolean(hair.transfer || hair.color);
}

export function defaultHairColor(): HairColorSelection {
  return { ...DEFAULT_HAIR_COLOR };
}
