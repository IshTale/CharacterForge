"use client";

import { buildNailVtoPayload } from "@/lib/nails/build-nail-payload";
import type { NailsConfig } from "@/types/nails";

export interface NailVtoRunResult {
  task_id: string;
  result_url: string | null;
  dst_id: string | null;
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

export async function runNailVto(
  srcFileId: string,
  config: NailsConfig
): Promise<NailVtoRunResult> {
  const payload = buildNailVtoPayload(srcFileId, config);
  const response = await fetch("/api/perfectcorp/nail-vto/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Nail VTO task failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Nail VTO task returned no response stream.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let taskId = "";
  let resultUrl: string | null = null;
  let dstId: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    for (const { event, data } of parseSseEvents(buffer)) {
      const eventPayload = data as Record<string, unknown>;
      if (event === "task_started" && typeof eventPayload.task_id === "string") {
        taskId = eventPayload.task_id;
      }
      if (event === "task_complete") {
        if (typeof eventPayload.task_id === "string") {
          taskId = eventPayload.task_id;
        }
        if (typeof eventPayload.result_url === "string") {
          resultUrl = eventPayload.result_url;
        }
        if (typeof eventPayload.dst_id === "string") {
          dstId = eventPayload.dst_id;
        }
      }
      if (event === "error") {
        throw new Error(
          typeof eventPayload.message === "string"
            ? eventPayload.message
            : "Nail VTO task failed."
        );
      }
    }
  }

  if (!taskId) {
    throw new Error("Nail VTO task did not return a task id.");
  }

  return { task_id: taskId, result_url: resultUrl, dst_id: dstId };
}
