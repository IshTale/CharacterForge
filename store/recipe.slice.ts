import type { Recipe } from "@/types/recipe";

export interface RecipeSlice {
  recipe: Recipe;
  dirtyModules: Set<string>;
  updateRecipe: (updater: (current: Recipe) => Recipe) => void;
  markDirty: (module: string) => void;
  clearDirty: (modules: string[]) => void;
}
