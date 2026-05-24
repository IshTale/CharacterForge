export async function runHairPipeline() {
  return { result_url: null as string | null };
}

export async function applyHairStyle() {
  return { dst_id: "mock-hair-style" };
}

export async function applyHairColor() {
  return { dst_id: "mock-hair-color" };
}

export async function applyHairExtension() {
  return { dst_id: "mock-hair-ext" };
}

export async function applyHairBangs() {
  return { dst_id: "mock-hair-bang" };
}

export async function applyHairVolume() {
  return { dst_id: "mock-hair-vol" };
}

export async function fetchHairStyles() {
  return [] as Array<{ id: string; title: string; thumbnailUrl: string }>;
}
