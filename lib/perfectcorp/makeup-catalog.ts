import type { MakeupCatalogConfig, MakeupPatternEntry } from "@/types/makeup";

const CATALOG_BASE = "https://plugins-media.makeupar.com/wcm-saas";

export function getCatalogUrl({ slug, kind }: MakeupCatalogConfig): string {
  return `${CATALOG_BASE}/${kind}/${slug}.json`;
}

export async function fetchMakeupCatalog(config: MakeupCatalogConfig): Promise<MakeupPatternEntry[]> {
  const response = await fetch(getCatalogUrl(config), {
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!response.ok) {
    throw new Error(`Failed to load makeup catalog: ${config.slug}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`Invalid makeup catalog format: ${config.slug}`);
  }

  return data as MakeupPatternEntry[];
}
