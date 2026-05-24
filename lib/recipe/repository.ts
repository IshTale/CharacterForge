import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Recipe } from "@/types/recipe";

const DATA_DIR = path.join(process.cwd(), ".data");
const RECIPES_FILE = path.join(DATA_DIR, "recipes.json");

interface RecipeRecord extends Recipe {
  recipe_id: string;
}

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(RECIPES_FILE, "utf8");
  } catch {
    await writeFile(RECIPES_FILE, "[]", "utf8");
  }
}

async function loadAll(): Promise<RecipeRecord[]> {
  await ensureStore();
  const raw = await readFile(RECIPES_FILE, "utf8");
  return JSON.parse(raw) as RecipeRecord[];
}

async function saveAll(recipes: RecipeRecord[]) {
  await writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2), "utf8");
}

export async function listRecipes() {
  const recipes = await loadAll();
  return recipes.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
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

export async function getRecipe(recipeId: string) {
  const recipes = await loadAll();
  return recipes.find((recipe) => recipe.recipe_id === recipeId) ?? null;
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
