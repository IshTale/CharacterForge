import Link from "next/link";
import { getRecipe } from "@/lib/recipe/repository";

interface RecipePageProps {
  params: Promise<{ recipe_id: string }>;
}

export default async function PublishedRecipePage({ params }: RecipePageProps) {
  const { recipe_id } = await params;
  const recipe = await getRecipe(recipe_id);

  if (!recipe) {
    return (
      <main className="mx-auto max-w-5xl p-10">
        <h1 className="text-3xl font-semibold">Recipe not found</h1>
        <p className="mt-2 text-gray-300">No published recipe matches this id.</p>
        <Link className="mt-6 inline-block text-sm text-gray-400 underline" href="/">
          Back to community
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-10">
      <Link className="text-sm text-gray-400 underline" href="/">
        ← Community
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">{recipe.title ?? "Untitled Recipe"}</h1>
      <p className="mt-2 text-gray-300">
        Published {new Date(recipe.created_at).toLocaleDateString()} — try-on replay uses this
        recipe JSON with your own canvas photos (not stored here).
      </p>
      <Link
        className="mt-6 inline-block rounded bg-white px-4 py-2 text-sm font-medium text-black"
        href="/studio"
      >
        Open studio to try on
      </Link>
    </main>
  );
}
