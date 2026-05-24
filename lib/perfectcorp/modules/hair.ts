import { randomUUID } from "node:crypto";
import {
  fetchHairStyleGroups,
  fetchHairStylesForGroup,
  fetchHairTransferTemplates,
  type HairV1Module
} from "@/lib/perfectcorp/hair-catalog";
import { postAndPollV2Task } from "@/lib/perfectcorp/v2-task-client";
import type { HairTransferTaskPayload } from "@/lib/hair/build-hair-transfer-payload";

export interface HairTaskResult {
  task_id: string | null;
  result_url: string | null;
  dst_id: string | null;
}

export async function applyHairTransfer(payload: HairTransferTaskPayload): Promise<HairTaskResult> {
  return postAndPollV2Task("/task/hair-transfer", payload as unknown as Record<string, unknown>, {
    apiVersion: "v2.1",
    stubPrefix: "hair-transfer"
  });
}

/** @deprecated Legacy stubs — not used in style-only hair flow */
export async function runHairPipeline() {
  return { result_url: null as string | null };
}

export async function applyHairStyle() {
  return { dst_id: `hair_style_${randomUUID()}` };
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
