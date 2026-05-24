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

export interface HairColorSelection {
  color_hex: string;
  intensity: number;
}

/** @deprecated Legacy v1 catalog selection — migrated away in favor of HairColorSelection */
export interface HairV1StyleSelection {
  style_group_id: string;
  style_group_title?: string;
  style_id: string;
  title?: string;
  thumb?: string;
}
