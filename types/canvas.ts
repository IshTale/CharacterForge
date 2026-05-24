import type { TaskResult, TaskStatus } from "@/types/perfectcorp";

export type CanvasKey = "headshot" | "fullbody" | "handwrist" | "feet";

export interface CanvasState {
  current_image_url: string | null;
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
