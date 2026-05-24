export class BlobStorage {
  async upload(filename: string, _data: Buffer | ArrayBuffer | Uint8Array) {
    // Placeholder: integrate @vercel/blob.
    return `https://example.com/blob/${encodeURIComponent(filename)}`;
  }

  async delete(_url: string) {
    return true;
  }
}
