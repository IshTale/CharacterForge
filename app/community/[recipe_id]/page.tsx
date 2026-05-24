import { getRecipe } from "@/lib/recipe/repository";

interface RecipePageProps {
  params: Promise<{ recipe_id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { recipe_id } = await params;
  const recipe = await getRecipe(recipe_id);

  return (
    <main className="mx-auto max-w-5xl p-10">
      <h1 className="text-3xl font-semibold">Recipe Try-On</h1>
      <p className="mt-2 text-gray-300">Viewing recipe: {recipe?.title ?? recipe_id}</p>
    </main>
  );
}
