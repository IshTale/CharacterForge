export class TaskTimeoutError extends Error {
  constructor(message = "Task polling timed out.") {
    super(message);
    this.name = "TaskTimeoutError";
  }
}

export class PollOrchestrator {
  async poll(options: {
    maxAttempts?: number;
    onProgress?: (attempt: number) => void;
    onCheck: (attempt: number) => Promise<"processing" | "success" | "error">;
  }) {
    const maxAttempts = options.maxAttempts ?? 120;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      options.onProgress?.(attempt);
      const status = await options.onCheck(attempt);
      if (status === "success") return;
      if (status === "error") throw new Error("Task failed.");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new TaskTimeoutError();
  }
}
