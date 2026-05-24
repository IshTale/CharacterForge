export type NailFinger = "all" | "thumb" | "index" | "middle" | "ring" | "pinky";

export type NailTexture = "matte" | "gloss" | "glitter" | "chrome" | "custom";

export type NailShape = "square" | "round" | "oval" | "stiletto" | "coffin";

export interface NailFingerStyle {
  texture?: NailTexture;
  custom_texture_url?: string | null;
  custom_texture_file_id?: string | null;
  color_hex?: string;
  intensity?: number;
  shape?: NailShape;
}

export interface NailsConfig {
  apply_to: NailFinger;
  global: NailFingerStyle;
  overrides?: Partial<Record<Exclude<NailFinger, "all">, NailFingerStyle>>;
}

export function createDefaultNailsConfig(): NailsConfig {
  return {
    apply_to: "all",
    global: {
      texture: "custom",
      shape: "oval",
      intensity: 90
    },
    overrides: {}
  };
}

export function activeNailStyle(config: NailsConfig): NailFingerStyle {
  if (config.apply_to === "all") {
    return config.global;
  }
  return config.overrides?.[config.apply_to] ?? config.global;
}
