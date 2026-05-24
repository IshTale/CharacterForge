import { NextResponse } from "next/server";
import {
  fetchHairStyleGroups,
  fetchHairStylesForGroup,
  isHairV1Module
} from "@/lib/perfectcorp/hair-catalog";

interface RouteContext {
  params: Promise<{ module: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { module } = await context.params;
  if (!isHairV1Module(module)) {
    return NextResponse.json({ error: `Unsupported hair module: ${module}` }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const styleGroupId = searchParams.get("style_group_id");

  try {
    if (styleGroupId) {
      const styles = await fetchHairStylesForGroup(module, styleGroupId);
      return NextResponse.json({ styles });
    }

    const pageSize = Number(searchParams.get("page_size") ?? "20");
    const styleGroups = await fetchHairStyleGroups(module, pageSize);
    return NextResponse.json({ style_groups: styleGroups });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load hair styles." },
      { status: 502 }
    );
  }
}
