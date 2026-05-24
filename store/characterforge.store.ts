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

export const useCharacterForgeStore = create<CharacterForgeStore>((set, get) => ({
  canvases: {
    headshot: createEmptyCanvas(),
    fullbody: createEmptyCanvas(),
    handwrist: createEmptyCanvas(),
    feet: createEmptyCanvas()
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
  triggerRender: async (_modules: string[]) => {
    // Placeholder orchestrator; actual module pipelines plug in here.
    await Promise.resolve();
  },
  publishRecipe: async () => {
    // Placeholder persistence call.
    return get().recipe.recipe_id ?? "draft-recipe-id";
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
      }
    })
}));
