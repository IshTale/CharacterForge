import { randomUUID } from "node:crypto";
import {
  extractRecipeForReplay,
  toRecipeListItems
} from "@/lib/recipe/publishing";
import { RedisCache } from "@/lib/storage/redis";
import type { PublishedRecipe, Recipe, RecipeListItem } from "@/types/recipe";

const redisCache = new RedisCache();

interface RecipeRecord extends Recipe {
  recipe_id: string;
}

async function loadAll(): Promise<RecipeRecord[]> {
  return (await redisCache.listRecipes()) as RecipeRecord[];
}

async function saveAll(recipes: RecipeRecord[]) {
  await redisCache.saveRecipes(recipes);
}

export async function listRecipes(): Promise<RecipeListItem[]> {
  const recipes = await loadAll();
  const sorted = recipes.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  // #region agent log
  void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H1,H2,H5',location:'lib/recipe/repository.ts:listRecipes',message:'Repository listed recipes',data:{count:sorted.length,recipeIds:sorted.slice(0,5).map((recipe)=>recipe.recipe_id),createdAts:sorted.slice(0,5).map((recipe)=>recipe.created_at)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
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
  // #region agent log
  void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H2,H3',location:'lib/recipe/repository.ts:createRecipe',message:'Repository created recipe',data:{recipeId:recipe.recipe_id,beforeCount:recipes.length-1,afterCount:recipes.length,createdAt:recipe.created_at},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
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
