import Link from "next/link";
import RecipeCard from "@/components/shared/RecipeCard";
import type { RecipeListItem } from "@/types/recipe";

interface CommunityDashboardProps {
  recipes: RecipeListItem[];
}

export default function CommunityDashboard({ recipes }: CommunityDashboardProps) {
  return (
    <main className="relative mx-auto max-w-5xl p-10 pb-24">
      <header className="beauty-card flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-magenta-600">
            CharacterForge
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-plum-900">Community Recipes</h1>
          <p className="mt-2 max-w-xl font-medium text-plum-800/80">
            Published character recipes you can try on with your own photos.
          </p>
        </div>
        <Link
          className="beauty-primary"
          href="/studio"
        >
          New Design
        </Link>
      </header>
      <RecipeList recipes={recipes} />
      <Link
        className="fixed bottom-6 right-6 rounded-full bg-magenta-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-magenta-500/30 md:hidden"
        href="/studio"
      >
        New Design
      </Link>
    </main>
  );
}

function RecipeList({ recipes }: { recipes: RecipeListItem[] }) {
  if (!recipes.length) {
    return <p className="mt-6 text-sm font-medium text-plum-800/75">No recipes published yet.</p>;
  }
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
      {recipes.map((recipe) => (
        <Link key={recipe.recipe_id} href={`/recipes/${recipe.recipe_id}`}>
          <RecipeCard
            title={recipe.title ?? "Untitled Recipe"}
            author="CharacterForge User"
            displayImageUrl={recipe.display_image_url}
          />
        </Link>
      ))}
    </div>
  );
}
