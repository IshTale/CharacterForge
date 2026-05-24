import { create } from "zustand";
import { buildMakeupEffects } from "@/lib/makeup/build-effects";
import { runMakeupVto } from "@/lib/makeup/run-makeup-vto";
import { runWardrobePipeline } from "@/lib/wardrobe/run-wardrobe-pipeline";
import { validateEffects } from "@/lib/perfectcorp/modules/makeup";
import type { CanvasKey, CanvasState } from "@/types/canvas";
import type { TaskResult, TaskStatus } from "@/types/perfectcorp";
import type { Recipe } from "@/types/recipe";
import { createDefaultWardrobeConfig } from "@/types/wardrobe";
import type { CanvasSlice } from "@/store/canvas.slice";
import type { RecipeSlice } from "@/store/recipe.slice";

const createEmptyCanvas = (): CanvasState => ({
  current_image_url: null,
  task_history: [],
  status: "idle"
});

const defaultRecipe: Recipe = {
  schema_version: "1.0",
  created_at: new Date().toISOString(),
  wardrobe: createDefaultWardrobeConfig(),
  makeup: { type: "custom" },
  hair: { style: null, color: null, extension: null, bangs: null, volume: null },
  nails: { apply_to: "all" },
  jewelry: { rings: [], bracelets: [], watch: null, necklace: null }
};

export interface CharacterForgeStore extends CanvasSlice, RecipeSlice {
  triggerRender: (modules: string[]) => Promise<void>;
  publishRecipe: () => Promise<string>;
  resetStudio: () => void;
}

const moduleToCanvas: Record<string, CanvasKey[]> = {
  wardrobe: ["fullbody", "headshot", "feet"],
  makeup: ["headshot"],
  hair: ["headshot"],
  nails: ["handwrist", "headshot"],
  shoes: ["feet"]
};

function buildTaskResult(canvas: CanvasKey, moduleName: string): TaskResult {
  return {
    task_id: `${moduleName}-${Date.now()}`,
    task_status: "success",
    result_url: `https://picsum.photos/seed/${canvas}-${moduleName}-${Date.now()}/1200/1200`
  };
}

export const useCharacterForgeStore = create<CharacterForgeStore>((set, get) => ({
  canvases: {
    headshot: createEmptyCanvas(),
    fullbody: createEmptyCanvas(),
    handwrist: createEmptyCanvas(),
    feet: createEmptyCanvas()
  },
  basePhotos: {
    headshot: null,
    fullbody: null,
    handwrist: null,
    feet: null
  },
  fileIds: {
    headshot: null,
    fullbody: null,
    handwrist: null,
    feet: null
  },
  setCanvasStatus: (canvas: CanvasKey, status: TaskStatus) =>
    set((state) => ({
      canvases: {
        ...state.canvases,
        [canvas]: { ...state.canvases[canvas], status }
      }
    })),
  setCanvasImage: (canvas: CanvasKey, url: string) =>
    set((state) => ({
      canvases: {
        ...state.canvases,
        [canvas]: { ...state.canvases[canvas], current_image_url: url, status: "success" }
      }
    })),
  appendTaskResult: (canvas: CanvasKey, result: TaskResult) =>
    set((state) => ({
      canvases: {
        ...state.canvases,
        [canvas]: {
          ...state.canvases[canvas],
          task_history: [...state.canvases[canvas].task_history, result]
        }
      }
    })),
  setBasePhoto: (canvas: CanvasKey, file: File | null) =>
    set((state) => ({
      basePhotos: {
        ...state.basePhotos,
        [canvas]: file
      }
    })),
  setFileId: (canvas: CanvasKey, fileId: string | null) =>
    set((state) => ({
      fileIds: {
        ...state.fileIds,
        [canvas]: fileId
      }
    })),
  recipe: defaultRecipe,
  dirtyModules: new Set(),
  updateRecipe: (updater) =>
    set((state) => ({
      recipe: updater(state.recipe)
    })),
  markDirty: (module: string) =>
    set((state) => ({
      dirtyModules: new Set([...state.dirtyModules, module])
    })),
  clearDirty: (modules: string[]) =>
    set((state) => {
      const next = new Set(state.dirtyModules);
      modules.forEach((moduleName) => next.delete(moduleName));
      return { dirtyModules: next };
    }),
  triggerRender: async (modules: string[]) => {
    const moduleList = [...modules];
    const stubModules = moduleList.filter((name) => name !== "makeup" && name !== "wardrobe");

    if (moduleList.includes("makeup")) {
      const headshotFileId = get().fileIds.headshot;
      get().setCanvasStatus("headshot", "processing");

      try {
        if (!headshotFileId) {
          throw new Error("Upload a headshot before applying makeup.");
        }

        const effects = buildMakeupEffects(get().recipe.makeup);
        if (effects.length === 0) {
          throw new Error("Configure at least one makeup effect before applying.");
        }
        validateEffects(effects);

        get().updateRecipe((recipe) => ({
          ...recipe,
          makeup: {
            ...recipe.makeup,
            api_effects: effects
          }
        }));

        const result = await runMakeupVto(headshotFileId, effects);
        if (result.result_url) {
          get().setCanvasImage("headshot", result.result_url);
        }
        get().appendTaskResult("headshot", {
          task_id: result.task_id,
          task_status: "success",
          result_url: result.result_url ?? undefined
        });
      } catch (error) {
        get().setCanvasStatus("headshot", "error");
        throw error;
      }
    }

    if (moduleList.includes("wardrobe")) {
      const canvases: CanvasKey[] = ["fullbody", "headshot", "feet"];
      canvases.forEach((canvas) => get().setCanvasStatus(canvas, "processing"));

      try {
        const wardrobe = get().recipe.wardrobe;
        const fileIds = get().fileIds;
        const result = await runWardrobePipeline(wardrobe, {
          headshot: fileIds.headshot,
          fullbody: fileIds.fullbody,
          feet: fileIds.feet
        });

        for (const [canvas, url] of Object.entries(result.canvasResults)) {
          if (url) {
            get().setCanvasImage(canvas as CanvasKey, url);
          }
          get().appendTaskResult(canvas as CanvasKey, {
            task_id: result.task_ids.join("-") || `wardrobe-${Date.now()}`,
            task_status: "success",
            result_url: url ?? undefined
          });
        }
      } catch (error) {
        canvases.forEach((canvas) => get().setCanvasStatus(canvas, "error"));
        throw error;
      }
    }

    if (stubModules.length > 0) {
      const targets = new Set<CanvasKey>();
      stubModules.forEach((moduleName) => {
        (moduleToCanvas[moduleName] ?? []).forEach((canvas) => targets.add(canvas));
      });

      targets.forEach((canvas) => get().setCanvasStatus(canvas, "processing"));
      await new Promise((resolve) => setTimeout(resolve, 850));

      targets.forEach((canvas) => {
        const result = buildTaskResult(canvas, stubModules.join("+"));
        if (result.result_url) {
          get().setCanvasImage(canvas, result.result_url);
        }
        get().appendTaskResult(canvas, result);
      });
    }

    get().clearDirty(modules);
  },
  publishRecipe: async () => {
    const response = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(get().recipe)
    });
    if (!response.ok) {
      throw new Error("Failed to publish recipe.");
    }
    const payload = (await response.json()) as { recipe_id: string };
    const recipeId = payload.recipe_id;
    set((state) => ({
      recipe: {
        ...state.recipe,
        recipe_id: recipeId
      }
    }));
    return recipeId;
  },
  resetStudio: () =>
    set({
      recipe: { ...defaultRecipe, created_at: new Date().toISOString() },
      dirtyModules: new Set(),
      canvases: {
        headshot: createEmptyCanvas(),
        fullbody: createEmptyCanvas(),
        handwrist: createEmptyCanvas(),
        feet: createEmptyCanvas()
      },
      basePhotos: {
        headshot: null,
        fullbody: null,
        handwrist: null,
        feet: null
      },
      fileIds: {
        headshot: null,
        fullbody: null,
        handwrist: null,
        feet: null
      }
    })
}));
