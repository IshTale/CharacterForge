import { kv } from "@vercel/kv";
import type { Recipe } from "@/types/recipe";

type RecipeRecord = Recipe & { recipe_id: string };

export class KvCache {
  private inMemory = new Map<string, string>();
  private recipeFallback: RecipeRecord[] = [];

  private async safeGet<T>(key: string): Promise<T | null> {
    try {
      const value = await kv.get<T>(key);
      return value ?? null;
    } catch {
      return null;
    }
  }

  private async safeSet(
    key: string,
    value: unknown,
    opts?: { ex?: number }
  ): Promise<boolean> {
    try {
      if (opts?.ex) {
        await kv.set(key, value, { ex: opts.ex });
      } else {
        await kv.set(key, value);
      }
      return true;
    } catch {
      return false;
    }
  }

  async getFileId(cacheKey: string) {
    const key = `file:${cacheKey}`;
    const value = await this.safeGet<string>(key);
    return value ?? this.inMemory.get(key) ?? null;
  }

  async setFileId(cacheKey: string, fileId: string) {
    const key = `file:${cacheKey}`;
    const persisted = await this.safeSet(key, fileId, { ex: 23 * 60 * 60 });
    if (!persisted) this.inMemory.set(key, fileId);
  }

  async getFileUrl(fileId: string) {
    const key = `file:url:${fileId}`;
    const value = await this.safeGet<string>(key);
    return value ?? this.inMemory.get(key) ?? null;
  }

  async setFileUrl(fileId: string, url: string) {
    const key = `file:url:${fileId}`;
    const persisted = await this.safeSet(key, url, { ex: 23 * 60 * 60 });
    if (!persisted) this.inMemory.set(key, url);
  }

  async getAccessToken() {
    const value = await this.safeGet<string>("auth:v1");
    return value ?? this.inMemory.get("auth:v1") ?? null;
  }

  async setAccessToken(token: string) {
    const persisted = await this.safeSet("auth:v1", token, { ex: 2 * 60 * 60 });
    if (!persisted) this.inMemory.set("auth:v1", token);
  }

  async listRecipes() {
    const persisted = await this.safeGet<RecipeRecord[]>("recipes:all");
    if (persisted) return persisted;
    return this.recipeFallback;
  }

  async saveRecipes(recipes: RecipeRecord[]) {
    const persisted = await this.safeSet("recipes:all", recipes);
    if (!persisted) this.recipeFallback = recipes;
  }
}
