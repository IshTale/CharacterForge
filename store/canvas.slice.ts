import type { CanvasKey, CanvasState, FileIds } from "@/types/canvas";
import type { TaskResult, TaskStatus } from "@/types/perfectcorp";

export interface CanvasSlice {
  canvases: Record<CanvasKey, CanvasState>;
  basePhotos: Record<CanvasKey, File | null>;
  fileIds: FileIds;
  setCanvasStatus: (canvas: CanvasKey, status: TaskStatus) => void;
  setCanvasImage: (canvas: CanvasKey, url: string) => void;
  appendTaskResult: (canvas: CanvasKey, result: TaskResult) => void;
  setBasePhoto: (canvas: CanvasKey, file: File | null) => void;
  setFileId: (canvas: CanvasKey, fileId: string | null) => void;
}
