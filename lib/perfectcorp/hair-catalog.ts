import { PERFECTCORP_V1_BASE, PERFECTCORP_V2_BASE, v2AuthHeaders } from "@/lib/perfectcorp/api-env";
import type {
  HairCatalogStyle,
  HairStyleGroup,
  HairTransferTemplate,
  HairTransferTemplatesResponse
} from "@/types/hair";

const V1_HAIR_MODULES = ["hair-style", "hair-ext", "hair-bang", "hair-vol"] as const;
export type HairV1Module = (typeof V1_HAIR_MODULES)[number];

export function isHairV1Module(value: string): value is HairV1Module {
  return (V1_HAIR_MODULES as readonly string[]).includes(value);
}

function parseStatus<T>(payload: { status?: number; data?: T }, fallback: T): T {
  if (payload.status === 200 && payload.data) {
    return payload.data;
  }
  return fallback;
}

export async function fetchHairTransferTemplates(
  pageSize = 20,
  startingToken?: string
): Promise<HairTransferTemplatesResponse> {
  const headers = v2AuthHeaders();
  if (!headers) {
    return { templates: [], next_token: null };
  }

  const params = new URLSearchParams({ page_size: String(pageSize) });
  if (startingToken) {
    params.set("starting_token", startingToken);
  }

  const response = await fetch(
    `${PERFECTCORP_V2_BASE}/s2s/v2.1/task/template/hair-transfer?${params}`,
    { headers, cache: "no-store" }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hair transfer templates failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    status?: number;
    data?: { templates?: HairTransferTemplate[]; next_token?: string | null };
  };

  const data = parseStatus(json, { templates: [], next_token: null });
  return {
    templates: data.templates ?? [],
    next_token: data.next_token ?? null
  };
}

export async function fetchHairStyleGroups(module: HairV1Module, pageSize = 20) {
  const headers = v2AuthHeaders();
  if (!headers) {
    return [] as HairStyleGroup[];
  }

  const params = new URLSearchParams({ page_size: String(pageSize) });
  const response = await fetch(
    `${PERFECTCORP_V1_BASE}/s2s/v1.0/task/style-group/${module}?${params}`,
    { headers, cache: "no-store" }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hair style groups failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    status?: number;
    data?: { style_groups?: Array<Record<string, unknown>> };
  };

  const groups = json.data?.style_groups ?? [];
  return groups.map((group) => ({
    id: String(group.id ?? group.style_group_id ?? ""),
    title: String(group.title ?? group.name ?? "Style group"),
    thumb: typeof group.thumb === "string" ? group.thumb : undefined
  }));
}

export async function fetchHairStylesForGroup(module: HairV1Module, styleGroupId: string) {
  const headers = v2AuthHeaders();
  if (!headers) {
    return [] as HairCatalogStyle[];
  }

  const params = new URLSearchParams({ style_group_id: styleGroupId });
  const response = await fetch(
    `${PERFECTCORP_V1_BASE}/s2s/v1.0/task/style/${module}?${params}`,
    { headers, cache: "no-store" }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hair styles failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as {
    status?: number;
    data?: { styles?: Array<Record<string, unknown>> };
  };

  const styles = json.data?.styles ?? [];
  return styles.map((style) => ({
    id: String(style.id ?? style.style_id ?? ""),
    title: String(style.title ?? style.name ?? "Style"),
    thumb: typeof style.thumb === "string" ? style.thumb : undefined,
    style_group_id: styleGroupId
  }));
}
