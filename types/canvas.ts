import type { TaskResult, TaskStatus } from "@/types/perfectcorp";

export type CanvasKey = "headshot" | "fullbody" | "handwrist" | "feet";
export type StudioSectionKey = "upload" | "wardrobe" | "makeup" | "hair" | "nails";

export interface CanvasSnapshot {
  image_url: string | null;
  file_id: string | null;
}

export interface StudioSectionSnapshot {
  canvases: Record<CanvasKey, CanvasSnapshot>;
  created_at: string;
}

export interface CanvasState {
  current_image_url: string | null;
  current_file_id: string | null;
  task_history: TaskResult[];
  status: TaskStatus;
}

export interface BasePhotos {
  headshot: File | null;
  fullbody: File | null;
  handwrist: File | null;
  feet: File | null;
}

export interface FileIds {
  headshot: string | null;
  fullbody: string | null;
  handwrist: string | null;
  feet: string | null;
}

export interface CanvasAssetState {
  basePhotos: BasePhotos;
  fileIds: FileIds;
}
