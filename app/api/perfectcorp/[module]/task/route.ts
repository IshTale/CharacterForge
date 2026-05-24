import { NextResponse } from "next/server";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { generateImageItem } from "@/lib/perfectcorp/modules/image-gen";
import { applyMakeup, validateEffects } from "@/lib/perfectcorp/modules/makeup";
import {
  applyBag,
  applyCloth,
  applyHat,
  applyShoes,
  type AccessoryTaskPayload,
  type ClothTaskPayload
} from "@/lib/perfectcorp/modules/wardrobe";
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

function parseClothPayload(body: Record<string, unknown>): ClothTaskPayload | null {
  if (typeof body.src_file_id !== "string" || typeof body.garment_category !== "string") {
    return null;
  }
  return body as unknown as ClothTaskPayload;
}

function parseAccessoryPayload(body: Record<string, unknown>): AccessoryTaskPayload | null {
  if (typeof body.src_file_id !== "string") {
    return null;
  }
  return body as unknown as AccessoryTaskPayload;
}

async function runStubTask(
  module: string,
  requestSeed: string | undefined,
  send: (event: string, data: unknown) => void
) {
  const task = createTask(module, requestSeed);
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
    return;
  }

  send("task_complete", {
    task_id: finalTask.task_id,
    task_status: normaliseTaskStatus(finalTask.task_status),
    result_url: finalTask.result_url,
    dst_id: `dst_${module}_${finalTask.task_id}`
  });
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

        if (module === "image-gen" && typeof body.prompt === "string") {
          send("progress", { step: "generating" });
          const generated = await generateImageItem({
            prompt: body.prompt,
            slot_id: typeof body.slot_id === "string" ? body.slot_id : undefined
          });

          if (generated.task_id && generated.result_url) {
            send("task_started", { module, task_id: generated.task_id, task_status: "processing" });
            send("task_complete", {
              task_id: generated.task_id,
              task_status: "success",
              result_url: generated.result_url,
              dst_id: generated.file_id
            });
            controller.close();
            return;
          }

          await runStubTask(
            module,
            `${body.prompt}:${body.slot_id ?? "item"}`,
            send
          );
          controller.close();
          return;
        }

        if (module === "cloth") {
          const payload = parseClothPayload(body);
          if (payload) {
            send("progress", { step: "try-on" });
            const result = await applyCloth(payload);
            if (result.task_id && result.result_url) {
              send("task_started", { module, task_id: result.task_id, task_status: "processing" });
              send("task_complete", {
                task_id: result.task_id,
                task_status: "success",
                result_url: result.result_url,
                dst_id: result.dst_id
              });
              controller.close();
              return;
            }
            if (result.dst_id) {
              await runStubTask(module, JSON.stringify(payload), send);
              controller.close();
              return;
            }
          }
        }

        if (module === "hat" || module === "bag" || module === "shoes") {
          const payload = parseAccessoryPayload(body);
          if (payload) {
            send("progress", { step: "try-on" });
            const applyFn =
              module === "hat" ? applyHat : module === "bag" ? applyBag : applyShoes;
            const result = await applyFn(payload);
            if (result.task_id && result.result_url) {
              send("task_started", { module, task_id: result.task_id, task_status: "processing" });
              send("task_complete", {
                task_id: result.task_id,
                task_status: "success",
                result_url: result.result_url,
                dst_id: result.dst_id
              });
              controller.close();
              return;
            }
            if (result.dst_id) {
              await runStubTask(module, JSON.stringify(payload), send);
              controller.close();
              return;
            }
          }
        }

        await runStubTask(
          module,
          requestSeed ?? (makeupPayload ? JSON.stringify(makeupPayload.effects) : undefined),
          send
        );
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
