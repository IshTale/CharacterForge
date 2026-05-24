import { del, put } from "@vercel/blob";
import { localUploadPublicUrl, saveLocalUpload } from "@/lib/storage/local-uploads";

export class BlobStorage {
  private hasVercelBlobToken() {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  }

  async upload(
    filename: string,
    data: Buffer | ArrayBuffer | Uint8Array,
    contentType = "application/octet-stream",
    options?: { fileId?: string; baseUrl?: string }
  ) {
    const body = (() => {
      if (Buffer.isBuffer(data)) return data;
      if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    })();

    if (this.hasVercelBlobToken()) {
      const blob = await put(filename, body, {
        access: "public",
        addRandomSuffix: true,
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return blob.url;
    }

    const fileId = options?.fileId;
    const baseUrl = options?.baseUrl ?? process.env.LOCAL_UPLOAD_BASE_URL ?? "http://localhost:3000";
    if (!fileId) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN is not set. Configure Vercel Blob or use local dev uploads with a file id."
      );
    }

    await saveLocalUpload(fileId, body, contentType);
    return localUploadPublicUrl(fileId, baseUrl);
  }

  async delete(url: string) {
    if (!this.hasVercelBlobToken()) {
      return url;
    }
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return url;
  }
}
