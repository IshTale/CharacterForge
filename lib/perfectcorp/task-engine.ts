import { randomUUID } from "node:crypto";
import type { TaskStatus } from "@/types/perfectcorp";

type ModuleTaskStatus = "processing" | "success" | "error";

interface EngineTask {
  task_id: string;
  module: string;
  started_at: string;
  task_status: ModuleTaskStatus;
  result_url?: string;
  error?: string;
}

const store = new Map<string, EngineTask>();

function buildResultUrl(moduleName: string, seed: string) {
  const hash = Buffer.from(`${moduleName}:${seed}`).toString("base64url").slice(0, 12);
  return `https://picsum.photos/seed/${hash}/1200/1200`;
}

export function createTask(moduleName: string, requestSeed?: string) {
  const taskId = randomUUID();
  const seed = requestSeed ?? randomUUID();
  const task: EngineTask = {
    task_id: taskId,
    module: moduleName,
    started_at: new Date().toISOString(),
    task_status: "processing"
  };
  store.set(taskId, task);

  setTimeout(() => {
    const current = store.get(taskId);
    if (!current) return;
    current.task_status = "success";
    current.result_url = buildResultUrl(moduleName, seed);
    store.set(taskId, current);
  }, 900);

  return task;
}

export function getTask(taskId: string) {
  return store.get(taskId) ?? null;
}

export function normaliseTaskStatus(status: ModuleTaskStatus): TaskStatus {
  if (status === "processing") return "processing";
  if (status === "success") return "success";
  return "error";
}
