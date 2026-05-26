import { create } from "zustand";
import { buildMakeupEffects } from "@/lib/makeup/build-effects";
import { runMakeupVto } from "@/lib/makeup/run-makeup-vto";
import { runWardrobePipeline } from "@/lib/wardrobe/run-wardrobe-pipeline";
import { validateEffects } from "@/lib/perfectcorp/modules/makeup";
import type {
  CanvasKey,
  CanvasSnapshot,
  CanvasState,
  StudioSectionKey,
  StudioSectionSnapshot
} from "@/types/canvas";
import type { TaskResult, TaskStatus } from "@/types/perfectcorp";
import { hairHasSelection, normalizeHairConfig } from "@/lib/hair/normalize-hair-config";
import { runHairTransfer } from "@/lib/hair/run-hair-transfer";
import { jewelryHasSelection } from "@/lib/jewelry/build-pipeline";
import { runJewelryPipeline } from "@/lib/jewelry/run-jewelry-pipeline";
import { prepareRecipeForPublish } from "@/lib/recipe/publishing";
import type { JewelryConfig, Recipe } from "@/types/recipe";
import { createDefaultNailsConfig } from "@/types/nails";
import { createDefaultWardrobeConfig } from "@/types/wardrobe";
import type { CanvasSlice } from "@/store/canvas.slice";
import type { RecipeSlice } from "@/store/recipe.slice";

const createEmptyCanvas = (): CanvasState => ({
  current_image_url: null,
  current_file_id: null,
  task_history: [],
  status: "idle"
});

const canvasKeys: CanvasKey[] = ["headshot", "fullbody", "handwrist", "feet"];
const studioSections: StudioSectionKey[] = ["upload", "wardrobe", "accessories", "hair", "makeup"];
const moduleToSection: Record<string, StudioSectionKey> = {
  wardrobe: "wardrobe",
  makeup: "makeup",
  hair: "hair",
  accessories: "accessories"
};

function hasJewelryRef(entry: { ref_file_id?: string; ref_image_url?: string } | null | undefined) {
  return Boolean(entry?.ref_file_id || entry?.ref_image_url);
}

function jewelryCanvasTargets(jewelry: JewelryConfig) {
  return {
    handwrist:
      jewelry.rings.some(hasJewelryRef) ||
      jewelry.bracelets.some(hasJewelryRef) ||
      hasJewelryRef(jewelry.watch),
    headshot: hasJewelryRef(jewelry.necklace)
  };
}

function createSectionSnapshot(
  canvases: Record<CanvasKey, CanvasState>
): StudioSectionSnapshot {
  const snapshot = canvasKeys.reduce(
    (next, canvas) => {
      next[canvas] = {
        image_url: canvases[canvas].current_image_url,
        file_id: canvases[canvas].current_file_id
      };
      return next;
    },
    {} as Record<CanvasKey, CanvasSnapshot>
  );

  return {
    canvases: snapshot,
    created_at: new Date().toISOString()
  };
}

function findSnapshotAtOrBefore(
  snapshots: Partial<Record<StudioSectionKey, StudioSectionSnapshot>>,
  section: StudioSectionKey
) {
  const index = studioSections.indexOf(section);
  for (let i = index; i >= 0; i -= 1) {
    const snapshot = snapshots[studioSections[i]];
    if (snapshot) {
      return snapshot;
    }
  }
  return null;
}

function findSnapshotBefore(
  snapshots: Partial<Record<StudioSectionKey, StudioSectionSnapshot>>,
  section: StudioSectionKey
) {
  const index = studioSections.indexOf(section);
  for (let i = index - 1; i >= 0; i -= 1) {
    const snapshot = snapshots[studioSections[i]];
    if (snapshot) {
      return snapshot;
    }
  }
  return null;
}

function applySnapshotToCanvases(
  current: Record<CanvasKey, CanvasState>,
  snapshot: StudioSectionSnapshot
) {
  return canvasKeys.reduce(
    (next, canvas) => {
      const saved = snapshot.canvases[canvas];
      next[canvas] = {
        ...current[canvas],
        current_image_url: saved.image_url,
        current_file_id: saved.file_id,
        status: saved.image_url || saved.file_id ? "success" : "idle"
      };
      return next;
    },
    {} as Record<CanvasKey, CanvasState>
  );
}

const defaultRecipe: Recipe = {
  schema_version: "1.0",
  created_at: new Date().toISOString(),
  wardrobe: createDefaultWardrobeConfig(),
  makeup: { type: "custom" },
  hair: { transfer: null, color: null },
  nails: createDefaultNailsConfig(),
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
  accessories: ["handwrist", "headshot"]
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
  sectionSnapshots: {},
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
  setCanvasImage: (canvas: CanvasKey, url: string | null, fileId?: string | null) =>
    set((state) => {
      const nextFileId =
        fileId === undefined ? state.canvases[canvas].current_file_id : fileId;
      return {
        canvases: {
          ...state.canvases,
          [canvas]: {
            ...state.canvases[canvas],
            current_image_url: url,
            current_file_id: nextFileId,
            status: url || nextFileId ? "success" : "idle"
          }
        }
      };
    }),
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
      },
      canvases: {
        ...state.canvases,
        [canvas]: {
          ...state.canvases[canvas],
          current_file_id: fileId,
          current_image_url: fileId ? state.canvases[canvas].current_image_url : null,
          status: fileId ? state.canvases[canvas].status : "idle"
        }
      }
    })),
  saveSectionSnapshot: (section: StudioSectionKey) =>
    set((state) => ({
      sectionSnapshots: {
        ...state.sectionSnapshots,
        [section]: createSectionSnapshot(state.canvases)
      }
    })),
  restoreSectionSnapshot: (section: StudioSectionKey) =>
    set((state) => {
      const snapshot = findSnapshotAtOrBefore(state.sectionSnapshots, section);
      if (!snapshot) {
        return {};
      }
      return {
        canvases: applySnapshotToCanvases(state.canvases, snapshot)
      };
    }),
  clearSnapshotsAfter: (section: StudioSectionKey) =>
    set((state) => {
      const sectionIndex = studioSections.indexOf(section);
      const sectionSnapshots = { ...state.sectionSnapshots };
      studioSections.slice(sectionIndex + 1).forEach((snapshotSection) => {
        delete sectionSnapshots[snapshotSection];
      });
      return { sectionSnapshots };
    }),
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
    const stubModules = moduleList.filter(
      (name) =>
        name !== "makeup" &&
        name !== "wardrobe" &&
        name !== "hair" &&
        name !== "accessories"
    );
    const restoreInputSnapshot = (moduleName: string) => {
      const section = moduleToSection[moduleName];
      if (!section) {
        return;
      }
      const snapshot = findSnapshotBefore(get().sectionSnapshots, section);
      if (!snapshot) {
        return;
      }
      set((state) => ({
        canvases: applySnapshotToCanvases(state.canvases, snapshot)
      }));
    };
    const sourceFileId = (moduleName: string, canvas: CanvasKey) => {
      const section = moduleToSection[moduleName];
      const snapshot = section ? findSnapshotBefore(get().sectionSnapshots, section) : null;
      return snapshot?.canvases[canvas].file_id ?? get().fileIds[canvas];
    };
    const sourceImageOrFileId = (moduleName: string, canvas: CanvasKey) => {
      const section = moduleToSection[moduleName];
      const snapshot = section ? findSnapshotBefore(get().sectionSnapshots, section) : null;
      return (
        snapshot?.canvases[canvas].image_url ??
        snapshot?.canvases[canvas].file_id ??
        get().canvases[canvas].current_image_url ??
        get().fileIds[canvas]
      );
    };
    const saveModuleSnapshot = (moduleName: string) => {
      const section = moduleToSection[moduleName];
      if (!section) {
        return;
      }
      get().saveSectionSnapshot(section);
      get().clearSnapshotsAfter(section);
    };

    if (moduleList.includes("makeup")) {
      restoreInputSnapshot("makeup");
      const headshotFileId = sourceFileId("makeup", "headshot");
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
          get().setCanvasImage("headshot", result.result_url, result.result_url);
        }
        get().appendTaskResult("headshot", {
          task_id: result.task_id,
          task_status: "success",
          result_url: result.result_url ?? undefined
        });
        saveModuleSnapshot("makeup");
      } catch (error) {
        get().setCanvasStatus("headshot", "error");
        throw error;
      }
    }

    if (moduleList.includes("wardrobe")) {
      restoreInputSnapshot("wardrobe");
      const canvases: CanvasKey[] = ["fullbody"];
      canvases.forEach((canvas) => get().setCanvasStatus(canvas, "processing"));

      try {
        const wardrobe = get().recipe.wardrobe;
        const fileIds = {
          headshot: sourceFileId("wardrobe", "headshot"),
          fullbody: sourceFileId("wardrobe", "fullbody")
        };
        const result = await runWardrobePipeline(wardrobe, {
          headshot: fileIds.headshot,
          fullbody: fileIds.fullbody
        });

        for (const [canvas, url] of Object.entries(result.canvasResults)) {
          const canvasKey = canvas as CanvasKey;
          if (url) {
            get().setCanvasImage(canvasKey, url, result.canvasFileIds[canvasKey] ?? null);
          }
          get().appendTaskResult(canvasKey, {
            task_id: result.task_ids.join("-") || `wardrobe-${Date.now()}`,
            task_status: "success",
            result_url: url ?? undefined
          });
        }
        saveModuleSnapshot("wardrobe");
      } catch (error) {
        canvases.forEach((canvas) => get().setCanvasStatus(canvas, "error"));
        throw error;
      }
    }

    if (moduleList.includes("hair")) {
      restoreInputSnapshot("hair");
      const headshotFileId = sourceFileId("hair", "headshot");
      if (!headshotFileId) {
        throw new Error("Upload a headshot before applying hair.");
      }
      const hair = normalizeHairConfig(get().recipe.hair);
      if (!hairHasSelection(hair) || !hair.transfer) {
        throw new Error("Select a hairstyle template or upload a reference before applying.");
      }

      get().setCanvasStatus("headshot", "processing");
      try {
        const result = await runHairTransfer(headshotFileId, hair.transfer);
        if (result.result_url) {
          get().setCanvasImage("headshot", result.result_url, result.result_url);
        }
        get().appendTaskResult("headshot", {
          task_id: result.task_id,
          task_status: "success",
          result_url: result.result_url ?? undefined
        });
        saveModuleSnapshot("hair");
      } catch (error) {
        get().setCanvasStatus("headshot", "error");
        throw error;
      }
    }

    if (moduleList.includes("accessories")) {
      restoreInputSnapshot("accessories");
      const handFileId = sourceImageOrFileId("accessories", "handwrist");
      const headshotFileId = sourceImageOrFileId("accessories", "headshot");
      const jewelry = get().recipe.jewelry;
      const hasJewelry = jewelryHasSelection(jewelry);
      const targets = jewelryCanvasTargets(jewelry);

      if (!hasJewelry) {
        throw new Error("Upload at least one accessory reference before applying.");
      }
      if (targets.handwrist && !handFileId) {
        throw new Error("Upload a hand & wrist photo before applying hand accessories.");
      }
      if (targets.headshot && !headshotFileId) {
        throw new Error("Upload a headshot before applying a necklace.");
      }

      if (targets.handwrist) {
        get().setCanvasStatus("handwrist", "processing");
      }
      if (targets.headshot) {
        get().setCanvasStatus("headshot", "processing");
      }

      try {
        const jewelryResult = await runJewelryPipeline(jewelry, {
          handwrist: handFileId,
          headshot: headshotFileId
        });
        const taskId = jewelryResult.task_ids.join("-") || `jewelry-${Date.now()}`;

        for (const [canvas, url] of Object.entries(jewelryResult.canvasResults)) {
          const canvasKey = canvas as CanvasKey;
          if (url) {
            get().setCanvasImage(canvasKey, url, jewelryResult.canvasFileIds[canvasKey] ?? null);
          }
          get().appendTaskResult(canvasKey, {
            task_id: taskId,
            task_status: "success",
            result_url: url ?? undefined
          });
        }
        saveModuleSnapshot("accessories");
      } catch (error) {
        if (targets.handwrist) {
          get().setCanvasStatus("handwrist", "error");
        }
        if (targets.headshot) {
          get().setCanvasStatus("headshot", "error");
        }
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
    const publishPayload = prepareRecipeForPublish(get().recipe);
    // #region agent log
    void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H3,H4',location:'store/characterforge.store.ts:publishRecipe:start',message:'Client publish started',data:{hasExistingRecipeId:Boolean(get().recipe.recipe_id),payloadCreatedAt:publishPayload.created_at,dirtyModules:[...get().dirtyModules],hasWindow:typeof window!=='undefined'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const response = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(publishPayload)
    });
    // #region agent log
    void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H3',location:'store/characterforge.store.ts:publishRecipe:response',message:'Client publish response received',data:{status:response.status,ok:response.ok},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Failed to publish recipe.");
    }
    const payload = (await response.json()) as { recipe_id: string; error?: string };
    if (!payload.recipe_id) {
      throw new Error(payload.error ?? "Failed to publish recipe.");
    }
    const recipeId = payload.recipe_id;
    set((state) => ({
      recipe: {
        ...state.recipe,
        recipe_id: recipeId
      }
    }));
    if (typeof window !== "undefined") {
      // #region agent log
      void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H3,H4',location:'store/characterforge.store.ts:publishRecipe:redirect',message:'Client publish parsed id and redirecting',data:{recipeId,redirectTo:'/'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      window.location.assign("/");
    }
    return recipeId;
  },
  resetStudio: () =>
    set({
      recipe: { ...defaultRecipe, created_at: new Date().toISOString() },
      dirtyModules: new Set(),
      sectionSnapshots: {},
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
