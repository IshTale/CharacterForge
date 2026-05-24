export interface WardrobeItem {
  item_id: string;
  type: "upper_body" | "lower_body" | "dresses" | "full_body";
  prompt: string;
  generated_image_url?: string;
}

export interface WardrobeConfig {
  items: WardrobeItem[];
  hat_ref_image_url?: string;
  bag_ref_image_url?: string;
  shoes_ref_image_url?: string;
}

export interface MakeupConfig {
  type: "custom" | "preset";
  color_hex?: string;
  intensity?: number;
}

export interface HairConfig {
  style: { style_group_id: string; style_id: string; title?: string } | null;
  color: { style_group_id: string; style_id: string; title?: string } | null;
  extension: { style_group_id: string; style_id: string; title?: string } | null;
  bangs: { style_group_id: string; style_id: string; title?: string } | null;
  volume: { style_group_id: string; style_id: string; title?: string } | null;
}

export interface NailsConfig {
  apply_to: "all" | "thumb" | "index" | "middle" | "ring" | "pinky";
  color_hex?: string;
  intensity?: number;
  texture?: string;
}

export interface JewelryConfig {
  rings: Array<{ finger: string; ref_image_url: string }>;
  bracelets: Array<{ wrist: "left" | "right"; ref_image_url: string }>;
  watch: { wrist: "left" | "right"; ref_image_url: string } | null;
  necklace: { ref_image_url: string } | null;
}

export interface Recipe {
  recipe_id?: string;
  schema_version: "1.0";
  created_at: string;
  title?: string;
  wardrobe: WardrobeConfig;
  makeup: MakeupConfig;
  hair: HairConfig;
  nails: NailsConfig;
  jewelry: JewelryConfig;
}
