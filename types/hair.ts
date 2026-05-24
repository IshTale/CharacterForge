export interface HairTransferTemplate {
  id: string;
  title: string;
  thumb: string;
  category_name: string;
  keep_users_color: boolean;
}

export interface HairTransferTemplatesResponse {
  templates: HairTransferTemplate[];
  next_token: string | null;
}

export interface HairStyleGroup {
  id: string;
  title: string;
  thumb?: string;
}

export interface HairCatalogStyle {
  id: string;
  title: string;
  thumb?: string;
  style_group_id?: string;
}

export interface HairTransferSelection {
  mode: "template" | "reference";
  template_id?: string;
  title?: string;
  thumb?: string;
  category_name?: string;
  keep_users_color?: boolean;
  ref_file_id?: string;
  ref_image_url?: string;
}

export type HairColorPatternName = "full" | "ombre";

export interface HairColorPalette {
  color: string;
  color_intensity: number;
  shine_intensity: number;
}

export interface HairColorPattern {
  name: HairColorPatternName;
  /** Ombre blend strength (0–100) */
  blend_strength?: number;
  /** Ombre vertical offset (−0.99 to 0.99) */
  line_offset?: number;
  /** Ombre section to color */
  coloring_section?: "top";
}

export interface HairColorSelection {
  /** Custom palettes + pattern, or a catalog preset name */
  mode: "custom" | "preset";
  preset?: string | null;
  pattern: HairColorPattern;
  palettes: HairColorPalette[];
}

/** @deprecated Legacy v1 catalog selection — migrated away in favor of HairColorSelection */
export interface HairV1StyleSelection {
  style_group_id: string;
  style_group_title?: string;
  style_id: string;
  title?: string;
  thumb?: string;
}
