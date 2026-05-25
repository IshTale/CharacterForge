import type {
  CanvasKey,
  CanvasState,
  FileIds,
  StudioSectionKey,
  StudioSectionSnapshot
} from "@/types/canvas";
import type { TaskResult, TaskStatus } from "@/types/perfectcorp";

export interface CanvasSlice {
  canvases: Record<CanvasKey, CanvasState>;
  sectionSnapshots: Partial<Record<StudioSectionKey, StudioSectionSnapshot>>;
  basePhotos: Record<CanvasKey, File | null>;
  fileIds: FileIds;
  setCanvasStatus: (canvas: CanvasKey, status: TaskStatus) => void;
  setCanvasImage: (canvas: CanvasKey, url: string | null, fileId?: string | null) => void;
  appendTaskResult: (canvas: CanvasKey, result: TaskResult) => void;
  setBasePhoto: (canvas: CanvasKey, file: File | null) => void;
  setFileId: (canvas: CanvasKey, fileId: string | null) => void;
  saveSectionSnapshot: (section: StudioSectionKey) => void;
  restoreSectionSnapshot: (section: StudioSectionKey) => void;
  clearSnapshotsAfter: (section: StudioSectionKey) => void;
}
