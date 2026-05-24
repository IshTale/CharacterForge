import { NextResponse } from "next/server";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { applyMakeup, validateEffects } from "@/lib/perfectcorp/modules/makeup";
import { createTask, getTask, normaliseTaskStatus } from "@/lib/perfectcorp/task-engine";
import type { MakeupApiEffect, MakeupVtoTaskPayload } from "@/types/makeup-api";

interface RouteContext {
  params: Promise<{ module: string }>;
}

function parseMakeupPayload(body: Record<string, unknown>): MakeupVtoTaskPayload | null {
  if (
    body.version !== "1.0" ||
    typeof body.src_file_id !== "string" ||
    !Array.isArray(body.effects)
  ) {
    return null;
  }
  return {
    version: "1.0",
    src_file_id: body.src_file_id,
    effects: body.effects as MakeupApiEffect[]
  };
}

export async function POST(request: Request, context: RouteContext) {
  const { module } = await context.params;
  if (!MODULE_CONFIG[module]) {
    return NextResponse.json({ error: `Unsupported module: ${module}` }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const requestSeed = typeof body.request_id === "string" ? body.request_id : undefined;
  const makeupPayload = module === "makeup-vto" ? parseMakeupPayload(body) : null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      try {
        if (makeupPayload) {
          validateEffects(makeupPayload.effects as MakeupApiEffect[]);
          send("progress", { step: "validating" });

          const result = await applyMakeup(makeupPayload);
          if (result.task_id && result.result_url) {
            send("task_started", {
              module,
              task_id: result.task_id,
              task_status: "processing"
            });
            send("task_complete", {
              task_id: result.task_id,
              task_status: "success",
              result_url: result.result_url,
              effects_count: makeupPayload.effects.length
            });
            controller.close();
            return;
          }
        }

        const task = createTask(
          module,
          requestSeed ?? (makeupPayload ? JSON.stringify(makeupPayload.effects) : undefined)
        );

        send("task_started", {
          module,
          task_id: task.task_id,
          task_status: "processing"
        });

        send("progress", { step: "queued" });
        await new Promise((resolve) => setTimeout(resolve, 450));
        send("progress", { step: "processing" });
        await new Promise((resolve) => setTimeout(resolve, 700));

        const finalTask = getTask(task.task_id);
        if (!finalTask) {
          send("error", { message: "Task disappeared before completion." });
        } else {
          send("task_complete", {
            task_id: finalTask.task_id,
            task_status: normaliseTaskStatus(finalTask.task_status),
            result_url: finalTask.result_url,
            effects_count: makeupPayload?.effects.length
          });
        }
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "Task failed."
        });
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
