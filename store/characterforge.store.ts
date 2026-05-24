import { create } from "zustand";
import type { CanvasKey, CanvasState } from "@/types/canvas";
import type { TaskResult, TaskStatus } from "@/types/perfectcorp";
import type { Recipe } from "@/types/recipe";
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
  wardrobe: { items: [] },
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
  wardrobe: ["fullbody"],
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
    const targets = new Set<CanvasKey>();
    modules.forEach((moduleName) => {
      (moduleToCanvas[moduleName] ?? []).forEach((canvas) => targets.add(canvas));
    });

    targets.forEach((canvas) => get().setCanvasStatus(canvas, "processing"));
    await new Promise((resolve) => setTimeout(resolve, 850));

    targets.forEach((canvas) => {
      const result = buildTaskResult(canvas, modules.join("+"));
      if (result.result_url) {
        get().setCanvasImage(canvas, result.result_url);
      }
      get().appendTaskResult(canvas, result);
    });
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
