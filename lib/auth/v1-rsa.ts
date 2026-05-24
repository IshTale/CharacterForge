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
    // Placeholder: swap with real RSA auth flow.
    this.token = "mock-v1-access-token";
    this.expiresAt = now + 55 * 60 * 1000;
    return this.token;
  }
}
