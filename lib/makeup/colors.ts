import { DEFAULT_MAKEUP_COLORS } from "@/constants/makeup-catalogs";

const DEFAULT_INTENSITY = 50;

export function normalizeColors(colors: string[] | undefined, colorNum: number): string[] {
  const next = [...(colors ?? [])].slice(0, colorNum);
  while (next.length < colorNum) {
    next.push(DEFAULT_MAKEUP_COLORS[next.length] ?? DEFAULT_MAKEUP_COLORS[0]);
  }
  return next;
}

export function normalizeIntensities(
  intensities: number[] | undefined,
  colorNum: number
): number[] {
  const next = [...(intensities ?? [])].slice(0, colorNum);
  while (next.length < colorNum) {
    next.push(DEFAULT_INTENSITY);
  }
  return next;
}

/** @deprecated Legacy recipe field; maps single `color` to `colors`. */
export function legacyColorsFromEffect(effect: {
  colors?: string[];
  color?: string;
}): string[] | undefined {
  if (effect.colors?.length) {
    return effect.colors;
  }
  if (typeof effect.color === "string") {
    return [effect.color];
  }
  return undefined;
}
