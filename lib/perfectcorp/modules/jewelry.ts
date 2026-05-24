export async function applyJewelry() {
  return {
    hand_result_url: null as string | null,
    head_result_url: null as string | null
  };
}

export async function applyRings() {
  return { dst_id: "mock-ring-dst" };
}

export async function applyBracelets() {
  return { dst_id: "mock-bracelet-dst" };
}
