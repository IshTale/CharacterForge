export type ApiFamily = "v1" | "v2";

export interface ModuleConfig {
  authFamily: ApiFamily;
  sourceCanvas: "headshot" | "fullbody" | "handwrist" | "feet";
}

export const MODULE_CONFIG: Record<string, ModuleConfig> = {
  "ai-look-vto": { authFamily: "v1", sourceCanvas: "headshot" },
  "image-gen": { authFamily: "v2", sourceCanvas: "fullbody" },
  "makeup-vto": { authFamily: "v2", sourceCanvas: "headshot" },
  "nail-vto": { authFamily: "v2", sourceCanvas: "handwrist" },
  cloth: { authFamily: "v2", sourceCanvas: "fullbody" },
  hat: { authFamily: "v2", sourceCanvas: "headshot" },
  bag: { authFamily: "v2", sourceCanvas: "fullbody" },
  shoes: { authFamily: "v2", sourceCanvas: "feet" },
  ring: { authFamily: "v2", sourceCanvas: "handwrist" },
  bracelet: { authFamily: "v2", sourceCanvas: "handwrist" },
  watch: { authFamily: "v2", sourceCanvas: "handwrist" },
  necklace: { authFamily: "v2", sourceCanvas: "headshot" },
  "hair-style": { authFamily: "v1", sourceCanvas: "headshot" },
  "hair-color": { authFamily: "v1", sourceCanvas: "headshot" },
  "hair-ext": { authFamily: "v1", sourceCanvas: "headshot" },
  "hair-bang": { authFamily: "v1", sourceCanvas: "headshot" },
  "hair-vol": { authFamily: "v1", sourceCanvas: "headshot" }
};
