import { NextResponse } from "next/server";
import { deleteRecipe, getRecipe, updateRecipe } from "@/lib/recipe/repository";

interface RouteContext {
  params: Promise<{ recipe_id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { recipe_id } = await context.params;
  const recipe = await getRecipe(recipe_id);
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }
  return NextResponse.json({ data: recipe });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { recipe_id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { title?: string };
  const updated = await updateRecipe(recipe_id, { title: body.title });
  if (!updated) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }
  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { recipe_id } = await context.params;
  const deleted = await deleteRecipe(recipe_id);
  if (!deleted) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
