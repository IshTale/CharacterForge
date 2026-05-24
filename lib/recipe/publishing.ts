import type { Recipe, RecipeListItem, PublishedRecipe } from "@/types/recipe";
import { serialiseRecipe } from "@/lib/recipe/serializer";

/** Fields safe to show on the community grid (no module payloads). */
const LIST_ITEM_KEYS: (keyof RecipeListItem)[] = [
  "recipe_id",
  "title",
  "created_at",
  "schema_version"
];

/**
 * Strip server-assigned id and validate before POST /api/recipes.
 * Base photos and canvas renders never live on Recipe — only in Zustand.
 */
export function prepareRecipeForPublish(recipe: Recipe): Omit<Recipe, "recipe_id"> {
  const { recipe_id: _id, ...payload } = recipe;
  return serialiseRecipe({
    ...payload,
    schema_version: "1.0",
    created_at: payload.created_at ?? new Date().toISOString()
  });
}

/** Full stored document after publish (list key + module config). */
export function toPublishedRecipe(
  record: Recipe & { recipe_id: string }
): PublishedRecipe {
  return serialiseRecipe(record) as PublishedRecipe;
}

export function toRecipeListItem(
  record: Recipe & { recipe_id: string }
): RecipeListItem {
  return {
    recipe_id: record.recipe_id,
    title: record.title,
    created_at: record.created_at,
    schema_version: record.schema_version
  };
}

export function toRecipeListItems(
  records: Array<Recipe & { recipe_id: string }>
): RecipeListItem[] {
  return records.map(toRecipeListItem);
}

/**
 * Recipe JSON used to replay try-on pipelines (community detail / studio import).
 * Same shape as storage; caller supplies the viewer's base photos separately.
 */
export function extractRecipeForReplay(stored: PublishedRecipe): PublishedRecipe {
  return serialiseRecipe(stored) as PublishedRecipe;
}

export function isRecipeListItem(value: unknown): value is RecipeListItem {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.recipe_id === "string" &&
    typeof row.created_at === "string" &&
    row.schema_version === "1.0" &&
    LIST_ITEM_KEYS.every((key) => key in row)
  );
}
