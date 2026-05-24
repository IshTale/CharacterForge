import { randomUUID } from "node:crypto";

export class RsaTokenManager {
  private static instance: RsaTokenManager | null = null;
  private token: string | null = null;
  private expiresAt = 0;

  static getInstance() {
    if (!RsaTokenManager.instance) {
      RsaTokenManager.instance = new RsaTokenManager();
    }
    return RsaTokenManager.instance;
  }

  async getAccessToken() {
    const now = Date.now();
    if (this.token && now < this.expiresAt) {
      return this.token;
    }
    this.token = `v1_${randomUUID()}`;
    this.expiresAt = now + 55 * 60 * 1000;
    return this.token;
  }
}
