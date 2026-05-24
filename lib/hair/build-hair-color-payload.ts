import type { HairColorSelection } from "@/types/hair";
import type { HairColorTaskPayload } from "@/types/hair-api";

export function validateHairColor(color: HairColorSelection): void {
  if (color.mode === "preset") {
    if (!color.preset?.trim()) {
      throw new Error("Select a hair color preset.");
    }
    return;
  }

  const expectedPalettes = color.pattern.name === "ombre" ? 2 : 1;
  if (!Array.isArray(color.palettes) || color.palettes.length !== expectedPalettes) {
    throw new Error(
      `Hair color "${color.pattern.name}" mode requires ${expectedPalettes} palette(s).`
    );
  }

  for (const palette of color.palettes) {
    if (!palette.color?.startsWith("#")) {
      throw new Error("Each hair color palette needs a hex color.");
    }
  }

  if (color.pattern.name === "ombre") {
    if (color.pattern.blend_strength == null) {
      throw new Error("Ombre hair color requires blend strength.");
    }
    if (color.pattern.line_offset == null) {
      throw new Error("Ombre hair color requires line offset.");
    }
    if (!color.pattern.coloring_section) {
      throw new Error('Ombre hair color requires coloring_section "top".');
    }
  }
}

export function buildHairColorPayload(
  srcFileId: string,
  color: HairColorSelection
): HairColorTaskPayload {
  validateHairColor(color);

  if (color.mode === "preset" && color.preset) {
    return { src_file_id: srcFileId, preset: color.preset };
  }

  const pattern =
    color.pattern.name === "ombre"
      ? {
          name: "ombre" as const,
          blend_strength: color.pattern.blend_strength ?? 50,
          line_offset: color.pattern.line_offset ?? 0,
          coloring_section: color.pattern.coloring_section ?? "top"
        }
      : { name: "full" as const };

  return {
    src_file_id: srcFileId,
    pattern,
    palettes: color.palettes.map((palette) => ({
      color: palette.color,
      color_intensity: palette.color_intensity,
      shine_intensity: palette.shine_intensity
    }))
  };
}
