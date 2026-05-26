import type { Recipe } from "@/types/recipe";
import type {
  HairColorSelection,
  HairTransferSelection,
  JewelryConfig,
  JewelryItemRef,
  MakeupConfig,
  MakeupEffectSelection,
  MakeupRegion
} from "@/types/recipe";
import type { NailFinger, NailFingerStyle, NailsConfig, NailTexture } from "@/types/nails";
import type { WardrobeConfig, WardrobeItemSource, WardrobeSlotState } from "@/types/wardrobe";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function optionalString(row: Record<string, unknown>, key: string) {
  return typeof row[key] === "string" ? row[key] : undefined;
}

function optionalNumber(row: Record<string, unknown>, key: string) {
  return typeof row[key] === "number" ? row[key] : undefined;
}

function optionalBoolean(row: Record<string, unknown>, key: string) {
  return typeof row[key] === "boolean" ? row[key] : undefined;
}

function cloneJson<T>(value: unknown): T | undefined {
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function definedEntries<T extends object>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

const wardrobeSources: WardrobeItemSource[] = ["generate", "upload"];
const makeupTypes: MakeupConfig["type"][] = ["custom", "preset"];
const makeupRegions: MakeupRegion[] = [
  "foundation",
  "concealer",
  "blush",
  "bronzer",
  "contour",
  "highlighter",
  "eyebrows",
  "eye_shadow",
  "eye_liner",
  "eyelashes",
  "lip_color",
  "lip_liner",
  "skin_smooth"
];
const nailFingers: NailFinger[] = ["all", "thumb", "index", "middle", "ring", "pinky"];
const nailOverrideFingers: Exclude<NailFinger, "all">[] = [
  "thumb",
  "index",
  "middle",
  "ring",
  "pinky"
];
const nailTextures: NailTexture[] = ["matte", "gloss", "glitter", "chrome", "custom"];
const nailShapes: NonNullable<NailFingerStyle["shape"]>[] = [
  "square",
  "round",
  "oval",
  "stiletto",
  "coffin"
];

function sanitizeWardrobeSlot(value: unknown): WardrobeSlotState {
  if (!isObject(value)) {
    return { source: null };
  }

  return definedEntries({
    source: isOneOf(value.source, wardrobeSources) ? value.source : null,
    prompt: optionalString(value, "prompt"),
    ref_file_id: optionalString(value, "ref_file_id"),
    ref_image_url: optionalString(value, "ref_image_url"),
    preview_url: optionalString(value, "preview_url")
  });
}

function sanitizeWardrobe(value: Record<string, unknown>): WardrobeConfig {
  const gender = value.gender === "male" ? "male" : "female";
  return {
    gender,
    top: sanitizeWardrobeSlot(value.top),
    bottom: sanitizeWardrobeSlot(value.bottom),
    hat: sanitizeWardrobeSlot(value.hat),
    bag: sanitizeWardrobeSlot(value.bag)
  };
}

function sanitizeMakeupEffects(value: unknown): MakeupConfig["effects"] | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  const effects: Partial<Record<MakeupRegion, MakeupEffectSelection>> = {};
  for (const region of makeupRegions) {
    if (isObject(value[region])) {
      effects[region] = cloneJson<MakeupEffectSelection>(value[region]);
    }
  }

  return Object.keys(effects).length > 0 ? effects : undefined;
}

function sanitizeMakeup(value: Record<string, unknown>): MakeupConfig {
  if (!isOneOf(value.type, makeupTypes)) {
    throw new Error("makeup.type must be 'custom' or 'preset'.");
  }

  return definedEntries({
    type: value.type,
    color_hex: optionalString(value, "color_hex"),
    intensity: optionalNumber(value, "intensity"),
    selected_region: isOneOf(value.selected_region, makeupRegions)
      ? value.selected_region
      : undefined,
    effects: sanitizeMakeupEffects(value.effects),
    api_effects: Array.isArray(value.api_effects)
      ? cloneJson<MakeupConfig["api_effects"]>(value.api_effects)
      : undefined
  });
}

function sanitizeHairTransfer(value: unknown): HairTransferSelection | null {
  if (!isObject(value) || !isOneOf(value.mode, ["template", "reference"] as const)) {
    return null;
  }

  return definedEntries({
    mode: value.mode,
    template_id: optionalString(value, "template_id"),
    title: optionalString(value, "title"),
    thumb: optionalString(value, "thumb"),
    category_name: optionalString(value, "category_name"),
    keep_users_color: optionalBoolean(value, "keep_users_color"),
    ref_file_id: optionalString(value, "ref_file_id"),
    ref_image_url: optionalString(value, "ref_image_url")
  });
}

function sanitizeNailStyle(value: unknown): NailFingerStyle {
  if (!isObject(value)) {
    return {};
  }

  return definedEntries({
    texture: isOneOf(value.texture, nailTextures) ? value.texture : undefined,
    custom_texture_url: typeof value.custom_texture_url === "string" ? value.custom_texture_url : null,
    custom_texture_file_id:
      typeof value.custom_texture_file_id === "string" ? value.custom_texture_file_id : null,
    color_hex: optionalString(value, "color_hex"),
    intensity: optionalNumber(value, "intensity"),
    shape: isOneOf(value.shape, nailShapes) ? value.shape : undefined
  });
}

function sanitizeNails(value: Record<string, unknown>): NailsConfig {
  const overrides: NailsConfig["overrides"] = {};
  if (isObject(value.overrides)) {
    for (const finger of nailOverrideFingers) {
      if (isObject(value.overrides[finger])) {
        overrides[finger] = sanitizeNailStyle(value.overrides[finger]);
      }
    }
  }

  return {
    apply_to: isOneOf(value.apply_to, nailFingers) ? value.apply_to : "all",
    global: sanitizeNailStyle(value.global),
    overrides
  };
}

function sanitizeJewelryRef(value: unknown): JewelryItemRef | null {
  if (!isObject(value)) {
    return null;
  }

  const ref = definedEntries({
    ref_file_id: optionalString(value, "ref_file_id"),
    ref_image_url: optionalString(value, "ref_image_url")
  });

  return ref.ref_file_id || ref.ref_image_url ? ref : null;
}

function sanitizeWrist(value: unknown): "left" | "right" {
  return value === "right" ? "right" : "left";
}

function sanitizeJewelry(value: Record<string, unknown>): JewelryConfig {
  const rings = Array.isArray(value.rings)
    ? value.rings.flatMap((entry) => {
        const ref = sanitizeJewelryRef(entry);
        if (!ref || !isObject(entry)) return [];
        return [{ ...ref, finger: optionalString(entry, "finger") ?? "ring" }];
      })
    : [];

  const bracelets = Array.isArray(value.bracelets)
    ? value.bracelets.flatMap((entry) => {
        const ref = sanitizeJewelryRef(entry);
        if (!ref || !isObject(entry)) return [];
        return [{ ...ref, wrist: sanitizeWrist(entry.wrist) }];
      })
    : [];

  const watchRef = sanitizeJewelryRef(value.watch);
  const watch =
    watchRef && isObject(value.watch)
      ? { ...watchRef, wrist: sanitizeWrist(value.watch.wrist) }
      : null;

  return {
    rings,
    bracelets,
    watch,
    necklace: sanitizeJewelryRef(value.necklace)
  };
}

export function validateRecipeSchema(recipe: unknown): Recipe {
  if (!isObject(recipe)) {
    throw new Error("Recipe must be an object.");
  }
  if (recipe.schema_version !== "1.0") {
    throw new Error("schema_version must be '1.0'.");
  }
  if (!isObject(recipe.wardrobe) || typeof recipe.wardrobe.gender !== "string") {
    throw new Error("wardrobe.gender is required.");
  }
  if (!isObject(recipe.makeup) || typeof recipe.makeup.type !== "string") {
    throw new Error("makeup.type is required.");
  }
  if (!isObject(recipe.hair) || !isObject(recipe.nails) || !isObject(recipe.jewelry)) {
    throw new Error("hair, nails, and jewelry are required.");
  }
  if (!isObject((recipe.nails as Record<string, unknown>).global)) {
    throw new Error("nails.global is required.");
  }
  if (typeof recipe.created_at !== "string") {
    throw new Error("created_at is required.");
  }

  const hair = recipe.hair;
  const output: Recipe = {
    schema_version: "1.0",
    created_at: recipe.created_at,
    wardrobe: sanitizeWardrobe(recipe.wardrobe),
    makeup: sanitizeMakeup(recipe.makeup),
    hair: {
      transfer: sanitizeHairTransfer(hair.transfer),
      color: isObject(hair.color) ? cloneJson<HairColorSelection>(hair.color) : null,
      selected_section:
        hair.selected_section === "hairstyle" || hair.selected_section === "color"
          ? hair.selected_section
          : undefined
    },
    nails: sanitizeNails(recipe.nails),
    jewelry: sanitizeJewelry(recipe.jewelry)
  };

  if (typeof recipe.recipe_id === "string") {
    output.recipe_id = recipe.recipe_id;
  }
  if (typeof recipe.title === "string") {
    output.title = recipe.title;
  }
  if (typeof recipe.display_image_url === "string") {
    output.display_image_url = recipe.display_image_url;
  }

  return output;
}
