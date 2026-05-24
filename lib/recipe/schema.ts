import type { Recipe } from "@/types/recipe";

export function validateRecipeSchema(recipe: Recipe) {
  if (!recipe.schema_version) {
    throw new Error("schema_version is required");
  }
  return recipe;
}
