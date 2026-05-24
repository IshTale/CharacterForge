import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

function extensionForMime(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  return ".bin";
}

export async function saveLocalUpload(
  fileId: string,
  bytes: Buffer,
  mimeType: string
): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${fileId}${extensionForMime(mimeType)}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return filename;
}

export async function readLocalUpload(fileId: string): Promise<{
  bytes: Buffer;
  mimeType: string;
} | null> {
  let entries: string[];
  try {
    entries = await readdir(UPLOAD_DIR);
  } catch {
    return null;
  }

  const match = entries.find((name) => name.startsWith(`${fileId}.`));
  if (!match) {
    return null;
  }

  const bytes = await readFile(path.join(UPLOAD_DIR, match));
  const ext = path.extname(match).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : ext === ".jpg" ? "image/jpeg" : "application/octet-stream";
  return { bytes, mimeType };
}

export function localUploadPublicUrl(fileId: string, baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, "");
  return `${normalized}/api/uploads/${fileId}`;
}

export function resolveUploadBaseUrl(request: Request) {
  if (process.env.LOCAL_UPLOAD_BASE_URL) {
    return process.env.LOCAL_UPLOAD_BASE_URL.replace(/\/$/, "");
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return "http://localhost:3000";
  }
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
