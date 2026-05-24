import Link from "next/link";
import RecipeCard from "@/components/shared/RecipeCard";
import { listRecipes } from "@/lib/recipe/repository";

interface RecipeRecord {
  recipe_id: string;
  title?: string;
  created_at: string;
}

async function loadRecipes() {
  return (await listRecipes()) as RecipeRecord[];
}

export default async function CommunityPage() {
  const recipes = await loadRecipes();
  return (
    <main className="mx-auto max-w-5xl p-10">
      <h1 className="text-3xl font-semibold">Community Recipes</h1>
      <p className="mt-2 text-gray-300">
        Published character recipes will appear here.
      </p>
      <RecipeList recipes={recipes} />
    </main>
  );
}

function RecipeList({ recipes }: { recipes: RecipeRecord[] }) {
  if (!recipes.length) {
    return <p className="mt-4 text-sm text-gray-400">No recipes published yet.</p>;
  }
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
      {recipes.map((recipe) => (
        <Link key={recipe.recipe_id} href={`/community/${recipe.recipe_id}`}>
          <RecipeCard title={recipe.title ?? "Untitled Recipe"} author="CharacterForge User" />
        </Link>
      ))}
    </div>
  );
}
