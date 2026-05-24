import { NextResponse } from "next/server";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { registerFile } from "@/lib/perfectcorp/file-registry";
import { ImageValidator } from "@/lib/validation/upload";

interface RouteContext {
  params: Promise<{ module: string }>;
}

function validateByCanvas(
  canvas: "headshot" | "fullbody" | "handwrist" | "feet",
  file: { type: string; size: number }
) {
  if (canvas === "headshot") ImageValidator.validateHeadshot(file);
  if (canvas === "fullbody") ImageValidator.validateFullBody(file);
  if (canvas === "handwrist") ImageValidator.validateHandWrist(file);
  if (canvas === "feet") ImageValidator.validateFeet(file);
}

export async function POST(request: Request, context: RouteContext) {
  const { module } = await context.params;
  const moduleConfig = MODULE_CONFIG[module];
  if (!moduleConfig) {
    return NextResponse.json({ error: `Unsupported module: ${module}` }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file form field." }, { status: 400 });
  }

  try {
    validateByCanvas(moduleConfig.sourceCanvas, { type: file.type, size: file.size });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid upload." },
      { status: 400 }
    );
  }

  const registered = registerFile({
    filename: file.name,
    mimeType: file.type,
    size: file.size
  });

  return NextResponse.json({
    module,
    file_id: registered.file_id,
    public_url: `https://example.characterforge.local/${registered.file_id}`
  });
}
