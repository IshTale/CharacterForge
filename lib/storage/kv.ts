export class KvCache {
  private inMemory = new Map<string, string>();

  async getFileId(cacheKey: string) {
    return this.inMemory.get(`file:${cacheKey}`) ?? null;
  }

  async setFileId(cacheKey: string, fileId: string) {
    this.inMemory.set(`file:${cacheKey}`, fileId);
  }

  async getAccessToken() {
    return this.inMemory.get("auth:v1") ?? null;
  }

  async setAccessToken(token: string) {
    this.inMemory.set("auth:v1", token);
  }
}
