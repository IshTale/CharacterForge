export interface MakeupPatternEntry {
  category: string;
  label: string;
  thumbnail: string;
  tags?: Array<{ id: number; name: string }>;
  colorNum?: number;
}

export type MakeupCatalogKind = "patterns" | "shapes";

export interface MakeupCatalogConfig {
  slug: string;
  kind: MakeupCatalogKind;
}
