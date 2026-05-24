import { NextResponse } from "next/server";
import { REGION_CATALOG } from "@/constants/makeup-catalogs";
import { fetchMakeupCatalog } from "@/lib/perfectcorp/makeup-catalog";
import type { MakeupRegion } from "@/types/recipe";

const SLUG_TO_REGION = Object.fromEntries(
  Object.entries(REGION_CATALOG).map(([region, config]) => [config!.slug, region])
) as Record<string, MakeupRegion>;

export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string }> }
) {
  const { category } = await context.params;
  const region = SLUG_TO_REGION[category];
  const config = region ? REGION_CATALOG[region] : null;

  if (!config || config.slug !== category) {
    return NextResponse.json({ error: `Unknown makeup catalog: ${category}` }, { status: 404 });
  }

  try {
    const patterns = await fetchMakeupCatalog(config);
    return NextResponse.json({ patterns, region, catalog: config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
