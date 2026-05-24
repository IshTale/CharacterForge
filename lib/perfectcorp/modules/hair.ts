import { randomUUID } from "node:crypto";

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

export async function fetchHairStyles() {
  return [] as Array<{ id: string; title: string; thumbnailUrl: string }>;
}
