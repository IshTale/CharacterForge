import { randomUUID } from "node:crypto";
import {
  fetchHairStyleGroups,
  fetchHairStylesForGroup,
  fetchHairTransferTemplates,
  type HairV1Module
} from "@/lib/perfectcorp/hair-catalog";

export async function runHairPipeline() {
  return { result_url: null as string | null };
}

export async function applyHairStyle() {
  return { dst_id: `hair_style_${randomUUID()}` };
}

export async function applyHairColor() {
  return { dst_id: `hair_color_${randomUUID()}` };
}

export async function applyHairExtension() {
  return { dst_id: `hair_ext_${randomUUID()}` };
}

export async function applyHairBangs() {
  return { dst_id: `hair_bang_${randomUUID()}` };
}

export async function applyHairVolume() {
  return { dst_id: `hair_vol_${randomUUID()}` };
}

export async function fetchHairTransferCatalog(pageSize = 20, startingToken?: string) {
  return fetchHairTransferTemplates(pageSize, startingToken);
}

export async function fetchHairV1Catalog(module: HairV1Module, styleGroupId?: string) {
  if (styleGroupId) {
    return fetchHairStylesForGroup(module, styleGroupId);
  }
  return fetchHairStyleGroups(module);
}
