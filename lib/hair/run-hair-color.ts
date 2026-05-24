"use client";

import { buildHairColorPayload } from "@/lib/hair/build-hair-color-payload";
import type { HairColorSelection } from "@/types/hair";

export interface HairColorRunResult {
  task_id: string;
  result_url: string | null;
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

export async function runHairColor(
  srcFileId: string,
  color: HairColorSelection
): Promise<HairColorRunResult> {
  const payload = buildHairColorPayload(srcFileId, color);
  const response = await fetch("/api/perfectcorp/hair-color/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Hair color task failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Hair color task returned no response stream.");
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
      }
      if (event === "error") {
        throw new Error(
          typeof eventPayload.message === "string"
            ? eventPayload.message
            : "Hair color task failed."
        );
      }
    }
  }

  if (!taskId) {
    throw new Error("Hair color task did not return a task id.");
  }

  return { task_id: taskId, result_url: resultUrl };
}
