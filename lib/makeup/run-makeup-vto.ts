"use client";

import type { MakeupApiEffect } from "@/types/makeup-api";

export interface MakeupVtoRunResult {
  task_id: string;
  result_url: string | null;
  effects: MakeupApiEffect[];
}

function parseSseEvents(buffer: string): Array<{ event: string; data: unknown }> {
  const events: Array<{ event: string; data: unknown }> = [];
  const chunks = buffer.split("\n\n");
  for (const chunk of chunks) {
    if (!chunk.trim()) {
      continue;
    }
    let event = "message";
    let dataLine = "";
    for (const line of chunk.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLine = line.slice(5).trim();
      }
    }
    if (dataLine) {
      try {
        events.push({ event, data: JSON.parse(dataLine) });
      } catch {
        events.push({ event, data: dataLine });
      }
    }
  }
  return events;
}

export async function runMakeupVto(
  srcFileId: string,
  effects: MakeupApiEffect[]
): Promise<MakeupVtoRunResult> {
  const response = await fetch("/api/perfectcorp/makeup-vto/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      src_file_id: srcFileId,
      version: "1.0",
      effects
    })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Makeup task failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Makeup task returned no response stream.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let taskId = "";
  let resultUrl: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const events = parseSseEvents(buffer);

    for (const { event, data } of events) {
      const payload = data as Record<string, unknown>;
      if (event === "task_started" && typeof payload.task_id === "string") {
        taskId = payload.task_id;
      }
      if (event === "task_complete") {
        if (typeof payload.task_id === "string") {
          taskId = payload.task_id;
        }
        if (typeof payload.result_url === "string") {
          resultUrl = payload.result_url;
        }
      }
      if (event === "error") {
        throw new Error(
          typeof payload.message === "string" ? payload.message : "Makeup task failed."
        );
      }
    }
  }

  if (!taskId) {
    throw new Error("Makeup task did not return a task id.");
  }

  return { task_id: taskId, result_url: resultUrl, effects };
}
