import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ recipe_id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { recipe_id } = await context.params;
  return NextResponse.json({ recipe_id, message: "Not implemented." }, { status: 501 });
}

export async function PATCH(_request: Request, context: RouteContext) {
  const { recipe_id } = await context.params;
  return NextResponse.json(
    { recipe_id, message: "Recipe update not implemented yet." },
    { status: 501 }
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { recipe_id } = await context.params;
  return NextResponse.json(
    { recipe_id, message: "Recipe deletion not implemented yet." },
    { status: 501 }
  );
}
