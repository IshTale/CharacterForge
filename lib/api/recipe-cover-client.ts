import { compressImageForUpload } from "@/lib/validation/compress-upload-image";

export async function uploadRecipeCover(file: File): Promise<string> {
  const uploadFile = await compressImageForUpload(file, { maxLongSidePx: 1200 });
  const form = new FormData();
  form.append("file", uploadFile);

  const response = await fetch("/api/recipes/cover", {
    method: "POST",
    body: form
  });
  const responseText = await response.text();

  if (!response.ok) {
    const payload = (() => {
      try {
        return JSON.parse(responseText) as { error?: string };
      } catch {
        return {};
      }
    })();
    throw new Error(payload.error ?? `Recipe cover upload failed (${response.status}).`);
  }

  const payload = JSON.parse(responseText) as { url?: string; error?: string };
  if (!payload.url) {
    throw new Error(payload.error ?? "Recipe cover upload did not return a URL.");
  }
  return payload.url;
}
