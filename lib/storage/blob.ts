export class BlobStorage {
  async upload(filename: string, data: Buffer | ArrayBuffer | Uint8Array) {
    const size =
      data instanceof Buffer
        ? data.byteLength
        : data instanceof ArrayBuffer
          ? data.byteLength
          : data.byteLength;
    return `https://blob.characterforge.local/${encodeURIComponent(filename)}?bytes=${size}`;
  }

  async delete(_url: string) {
    return true;
  }
}
