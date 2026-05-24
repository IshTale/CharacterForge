export function validateEffects(effects: unknown[]) {
  if (!Array.isArray(effects)) {
    throw new Error("effects must be an array");
  }
  return true;
}

export async function applyMakeup() {
  return { result_url: null as string | null };
}

export async function applyLookVto() {
  return { result_url: null as string | null };
}
