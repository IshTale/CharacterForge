import { NextResponse } from "next/server";
import { createRecipe, listRecipes } from "@/lib/recipe/repository";
import { deserialiseRecipe } from "@/lib/recipe/serializer";

export async function GET() {
  const recipes = await listRecipes();
  return NextResponse.json({ data: recipes, total: recipes.length });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const recipe = deserialiseRecipe(body);
    const created = await createRecipe(recipe);
    return NextResponse.json({ recipe_id: created.recipe_id, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid recipe payload." },
      { status: 400 }
    );
  }
}
