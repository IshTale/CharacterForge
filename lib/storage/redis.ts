import { Redis as UpstashRedis } from "@upstash/redis";
import { createClient } from "redis";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Recipe } from "@/types/recipe";

type RecipeRecord = Recipe & { recipe_id: string };

interface RedisStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ttlSeconds?: number }): Promise<void>;
}

const RECIPE_FALLBACK_FILE = path.join(process.cwd(), ".data", "recipes.json");

function agentDebugLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data: Record<string, unknown>;
}) {
  const entry = {
    sessionId: "270c40",
    runId: "prod-replay",
    ...payload,
    timestamp: Date.now()
  };
  void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify(entry)}).catch(()=>{});
  console.log("[agent-debug]", JSON.stringify(entry));
}

function classifyUrlScheme(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).protocol.replace(":", "");
  } catch {
    return "invalid";
  }
}

function errorShape(error: unknown) {
  const details = error as { name?: unknown; code?: unknown };
  return {
    name: typeof details.name === "string" ? details.name : "Error",
    code: typeof details.code === "string" ? details.code : null
  };
}

function encodeValue(value: unknown) {
  return JSON.stringify(value);
}

function decodeValue<T>(value: string | null): T | null {
  if (value === null) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

function redisUrl() {
  return process.env.KV_REST_REDIS_URL?.trim() || null;
}

function upstashRestConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    return null;
  }
  return { url, token };
}

async function createRedisUrlStore(url: string): Promise<RedisStore> {
  const client = createClient({ url });
  client.on("error", (error) => {
    console.error("[redis]", error);
  });
  await client.connect();

  return {
    get: (key) => client.get(key),
    set: async (key, value, options) => {
      if (options?.ttlSeconds) {
        await client.set(key, value, { EX: options.ttlSeconds });
      } else {
        await client.set(key, value);
      }
    }
  };
}

function createUpstashStore(config: { url: string; token: string }): RedisStore {
  const redis = new UpstashRedis(config);
  return {
    get: async (key) => {
      const value = await redis.get<string>(key);
      return typeof value === "string" ? value : value == null ? null : JSON.stringify(value);
    },
    set: async (key, value, options) => {
      if (options?.ttlSeconds) {
        await redis.set(key, value, { ex: options.ttlSeconds });
      } else {
        await redis.set(key, value);
      }
    }
  };
}

async function createStore(): Promise<RedisStore | null> {
  const directUrl = redisUrl();
  // #region agent log
  agentDebugLog({
    hypothesisId: "P1,P2",
    location: "lib/storage/redis.ts:createStore",
    message: "Storage createStore evaluated Redis env",
    data: {
      hasKvRestRedisUrl: Boolean(directUrl),
      kvRestRedisUrlScheme: classifyUrlScheme(directUrl),
      hasUpstashRestUrl: Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()),
      hasUpstashRestToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim())
    }
  });
  // #endregion
  if (directUrl) {
    return createRedisUrlStore(directUrl);
  }

  const restConfig = upstashRestConfig();
  if (restConfig) {
    return createUpstashStore(restConfig);
  }

  return null;
}

export class RedisCache {
  private static storePromise: Promise<RedisStore | null> | null = null;
  private static memory = new Map<string, string>();
  private static recipeFallback: RecipeRecord[] = [];

  private async store() {
    RedisCache.storePromise ??= createStore().catch((error) => {
      console.error("[redis] connection failed", error);
      // #region agent log
      agentDebugLog({
        hypothesisId: "P1,P2",
        location: "lib/storage/redis.ts:store:connectionFailed",
        message: "Storage Redis connection failed",
        data: errorShape(error)
      });
      // #endregion
      RedisCache.storePromise = null;
      return null;
    });
    return RedisCache.storePromise;
  }

  private async readRecipeFallback() {
    try {
      const raw = await readFile(RECIPE_FALLBACK_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        RedisCache.recipeFallback = parsed as RecipeRecord[];
      }
    } catch {
      // Local fallback is best-effort; absence just means no local recipes yet.
    }
    return RedisCache.recipeFallback;
  }

  private async writeRecipeFallback(recipes: RecipeRecord[]) {
    RedisCache.recipeFallback = recipes;
    await mkdir(path.dirname(RECIPE_FALLBACK_FILE), { recursive: true });
    await writeFile(RECIPE_FALLBACK_FILE, JSON.stringify(recipes, null, 2));
  }

  private async safeGet<T>(key: string): Promise<T | null> {
    try {
      const store = await this.store();
      if (!store) return null;
      return decodeValue<T>(await store.get(key));
    } catch (error) {
      // #region agent log
      agentDebugLog({
        hypothesisId: "P1,P3",
        location: "lib/storage/redis.ts:safeGet",
        message: "Storage Redis get failed",
        data: { key, ...errorShape(error) }
      });
      // #endregion
      return null;
    }
  }

  private async safeSet(
    key: string,
    value: unknown,
    opts?: { ex?: number }
  ): Promise<boolean> {
    try {
      const store = await this.store();
      if (!store) return false;
      await store.set(key, encodeValue(value), { ttlSeconds: opts?.ex });
      return true;
    } catch (error) {
      // #region agent log
      agentDebugLog({
        hypothesisId: "P1,P3",
        location: "lib/storage/redis.ts:safeSet",
        message: "Storage Redis set failed",
        data: { key, ...errorShape(error) }
      });
      // #endregion
      return false;
    }
  }

  async getFileId(cacheKey: string) {
    const key = `file:${cacheKey}`;
    const value = await this.safeGet<string>(key);
    return value ?? RedisCache.memory.get(key) ?? null;
  }

  async setFileId(cacheKey: string, fileId: string) {
    const key = `file:${cacheKey}`;
    const persisted = await this.safeSet(key, fileId, { ex: 23 * 60 * 60 });
    if (!persisted) RedisCache.memory.set(key, fileId);
  }

  async getFileUrl(fileId: string) {
    const key = `file:url:${fileId}`;
    const value = await this.safeGet<string>(key);
    return value ?? RedisCache.memory.get(key) ?? null;
  }

  async setFileUrl(fileId: string, url: string) {
    const key = `file:url:${fileId}`;
    const persisted = await this.safeSet(key, url, { ex: 23 * 60 * 60 });
    if (!persisted) RedisCache.memory.set(key, url);
  }

  async getAccessToken() {
    const value = await this.safeGet<string>("auth:v1");
    return value ?? RedisCache.memory.get("auth:v1") ?? null;
  }

  async setAccessToken(token: string) {
    const persisted = await this.safeSet("auth:v1", token, { ex: 2 * 60 * 60 });
    if (!persisted) RedisCache.memory.set("auth:v1", token);
  }

  async listRecipes() {
    const persisted = await this.safeGet<RecipeRecord[]>("recipes:all");
    if (persisted) {
      // #region agent log
      void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H2',location:'lib/storage/redis.ts:listRecipes:persisted',message:'Storage listed recipes from persisted store',data:{source:'persisted',count:persisted.length,recipeIds:persisted.slice(-5).map((recipe)=>recipe.recipe_id)},timestamp:Date.now()})}).catch(()=>{});
      agentDebugLog({
        hypothesisId: "P1,P2,P3",
        location: "lib/storage/redis.ts:listRecipes:persisted",
        message: "Storage listed recipes from persisted store",
        data: {
          source: "persisted",
          count: persisted.length,
          recipeIds: persisted.slice(-5).map((recipe) => recipe.recipe_id)
        }
      });
      // #endregion
      return persisted;
    }
    const fallback = await this.readRecipeFallback();
    // #region agent log
    void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H2',location:'lib/storage/redis.ts:listRecipes:fallback',message:'Storage listed recipes from fallback store',data:{source:'fallback',count:fallback.length,recipeIds:fallback.slice(-5).map((recipe)=>recipe.recipe_id)},timestamp:Date.now()})}).catch(()=>{});
    agentDebugLog({
      hypothesisId: "P1,P2,P3",
      location: "lib/storage/redis.ts:listRecipes:fallback",
      message: "Storage listed recipes from fallback store",
      data: {
        source: "fallback",
        count: fallback.length,
        recipeIds: fallback.slice(-5).map((recipe) => recipe.recipe_id)
      }
    });
    // #endregion
    return fallback;
  }

  async saveRecipes(recipes: RecipeRecord[]) {
    const persisted = await this.safeSet("recipes:all", recipes);
    if (!persisted) await this.writeRecipeFallback(recipes);
    // #region agent log
    void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H2',location:'lib/storage/redis.ts:saveRecipes',message:'Storage saved recipes',data:{source:persisted?'persisted':'fallback',count:recipes.length,recipeIds:recipes.slice(-5).map((recipe)=>recipe.recipe_id)},timestamp:Date.now()})}).catch(()=>{});
    agentDebugLog({
      hypothesisId: "P1,P2,P3",
      location: "lib/storage/redis.ts:saveRecipes",
      message: "Storage saved recipes",
      data: {
        source: persisted ? "persisted" : "fallback",
        count: recipes.length,
        recipeIds: recipes.slice(-5).map((recipe) => recipe.recipe_id)
      }
    });
    // #endregion
  }
}
