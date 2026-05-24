import type { Recipe } from "@/types/recipe";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
  return recipe as unknown as Recipe;
}
