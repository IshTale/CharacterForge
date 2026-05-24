import type { Recipe } from "@/types/recipe";
import { validateRecipeSchema } from "@/lib/recipe/schema";

export function serialiseRecipe(recipe: Recipe) {
  return validateRecipeSchema(recipe);
}

export function deserialiseRecipe(raw: unknown) {
  return validateRecipeSchema(raw as Recipe);
}
