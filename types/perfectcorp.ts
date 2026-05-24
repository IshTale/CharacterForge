export type TaskStatus = "idle" | "uploading" | "processing" | "success" | "error";

export interface NormalisedError {
  code: string;
  message: string;
  retryable: boolean;
  userFacingMessage: string;
}

export interface TaskResult {
  task_id: string;
  task_status: TaskStatus;
  result_url?: string;
  polling_interval?: number;
  error?: NormalisedError;
}

export interface FileUploadResponse {
  file_id: string;
  upload_url?: string;
  expiry?: string;
}

export type ApiFamily = "v1" | "v2";
