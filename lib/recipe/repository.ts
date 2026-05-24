import { randomUUID } from "node:crypto";
import {
  extractRecipeForReplay,
  toRecipeListItems
} from "@/lib/recipe/publishing";
import { KvCache } from "@/lib/storage/kv";
import type { PublishedRecipe, Recipe, RecipeListItem } from "@/types/recipe";

const kvCache = new KvCache();

interface RecipeRecord extends Recipe {
  recipe_id: string;
}

async function loadAll(): Promise<RecipeRecord[]> {
  return (await kvCache.listRecipes()) as RecipeRecord[];
}

async function saveAll(recipes: RecipeRecord[]) {
  await kvCache.saveRecipes(recipes);
}

export async function listRecipes(): Promise<RecipeListItem[]> {
  const recipes = await loadAll();
  const sorted = recipes.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return toRecipeListItems(sorted);
}

export async function createRecipe(input: Recipe) {
  const recipes = await loadAll();
  const recipe: RecipeRecord = {
    ...input,
    recipe_id: randomUUID(),
    created_at: input.created_at ?? new Date().toISOString()
  };
  recipes.push(recipe);
  await saveAll(recipes);
  return recipe;
}

export async function getRecipe(recipeId: string): Promise<PublishedRecipe | null> {
  const recipes = await loadAll();
  const record = recipes.find((recipe) => recipe.recipe_id === recipeId);
  if (!record) return null;
  return extractRecipeForReplay(record);
}

export async function updateRecipe(
  recipeId: string,
  patch: Partial<Pick<Recipe, "title">>
) {
  const recipes = await loadAll();
  const index = recipes.findIndex((recipe) => recipe.recipe_id === recipeId);
  if (index === -1) return null;
  recipes[index] = { ...recipes[index], ...patch };
  await saveAll(recipes);
  return recipes[index];
}

export async function deleteRecipe(recipeId: string) {
  const recipes = await loadAll();
  const filtered = recipes.filter((recipe) => recipe.recipe_id !== recipeId);
  const deleted = filtered.length !== recipes.length;
  if (deleted) {
    await saveAll(filtered);
  }
  return deleted;
}
