import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ module: string; id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { module, id } = await context.params;
  return NextResponse.json(
    {
      message: "Task status proxy not implemented yet.",
      module,
      id
    },
    { status: 501 }
  );
}
