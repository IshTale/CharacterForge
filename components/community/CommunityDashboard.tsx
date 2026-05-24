import Link from "next/link";
import RecipeCard from "@/components/shared/RecipeCard";
import type { RecipeListItem } from "@/types/recipe";

interface CommunityDashboardProps {
  recipes: RecipeListItem[];
}

export default function CommunityDashboard({ recipes }: CommunityDashboardProps) {
  return (
    <main className="relative mx-auto max-w-5xl p-10 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Community Recipes</h1>
          <p className="mt-2 text-gray-300">
            Published character recipes you can try on with your own photos.
          </p>
        </div>
        <Link
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black"
          href="/studio"
        >
          New Design
        </Link>
      </header>
      <RecipeList recipes={recipes} />
      <Link
        className="fixed bottom-6 right-6 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg md:hidden"
        href="/studio"
      >
        New Design
      </Link>
    </main>
  );
}

function RecipeList({ recipes }: { recipes: RecipeListItem[] }) {
  if (!recipes.length) {
    return <p className="mt-6 text-sm text-gray-400">No recipes published yet.</p>;
  }
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
      {recipes.map((recipe) => (
        <Link key={recipe.recipe_id} href={`/recipes/${recipe.recipe_id}`}>
          <RecipeCard title={recipe.title ?? "Untitled Recipe"} author="CharacterForge User" />
        </Link>
      ))}
    </div>
  );
}
