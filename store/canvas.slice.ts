import type { CanvasKey, CanvasState } from "@/types/canvas";
import type { TaskResult, TaskStatus } from "@/types/perfectcorp";

export interface CanvasSlice {
  canvases: Record<CanvasKey, CanvasState>;
  setCanvasStatus: (canvas: CanvasKey, status: TaskStatus) => void;
  setCanvasImage: (canvas: CanvasKey, url: string) => void;
  appendTaskResult: (canvas: CanvasKey, result: TaskResult) => void;
}
