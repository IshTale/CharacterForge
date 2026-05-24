import { randomUUID } from "node:crypto";

interface RegisteredFile {
  file_id: string;
  filename: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
}

const files = new Map<string, RegisteredFile>();

export function registerFile(input: { filename: string; mimeType: string; size: number }) {
  const fileId = `file_${randomUUID()}`;
  const record: RegisteredFile = {
    file_id: fileId,
    filename: input.filename,
    mime_type: input.mimeType,
    size: input.size,
    uploaded_at: new Date().toISOString()
  };
  files.set(fileId, record);
  return record;
}

export function getFile(fileId: string) {
  return files.get(fileId) ?? null;
}
