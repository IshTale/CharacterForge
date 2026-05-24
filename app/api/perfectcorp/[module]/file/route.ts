import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ module: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { module } = await context.params;
  return NextResponse.json(
    {
      message: "File upload proxy not implemented yet.",
      module
    },
    { status: 501 }
  );
}
