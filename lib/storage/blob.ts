import { del, put } from "@vercel/blob";

export class BlobStorage {
  async upload(
    filename: string,
    data: Buffer | ArrayBuffer | Uint8Array,
    contentType = "application/octet-stream"
  ) {
    const body = (() => {
      if (Buffer.isBuffer(data)) return data;
      if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    })();
    const blob = await put(filename, body, {
      access: "public",
      addRandomSuffix: true,
      contentType
    });
    return blob.url;
  }

  async delete(url: string) {
    await del(url);
    return url;
  }
}
