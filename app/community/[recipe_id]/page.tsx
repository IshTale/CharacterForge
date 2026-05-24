interface RecipePageProps {
  params: Promise<{ recipe_id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { recipe_id } = await params;
  return (
    <main className="mx-auto max-w-5xl p-10">
      <h1 className="text-3xl font-semibold">Recipe Try-On</h1>
      <p className="mt-2 text-gray-300">Viewing recipe: {recipe_id}</p>
    </main>
  );
}
