export type NailVtoFinger = "thumb" | "index" | "middle" | "ring" | "pinky";

export type NailVtoEffectType = "nail_polish" | "press_on_nails";

export interface NailVtoDesignEffect {
  sub_type: "design";
  finger: NailVtoFinger;
  texture: string;
  reflection: number;
  contrast: number;
  roughness: number;
  ref_file_index?: number;
  ref_file_url?: string;
}

export interface NailVtoTaskPayload {
  version: "1.0";
  src_file_id: string;
  effect_type: NailVtoEffectType;
  ref_file_ids?: string[];
  effects: NailVtoDesignEffect[];
}
