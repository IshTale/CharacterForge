import { NextResponse } from "next/server";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { applyHairTransfer } from "@/lib/perfectcorp/modules/hair";
import {
  applyBracelet,
  applyNecklace,
  applyRing,
  applyWatch,
  type JewelryVtoPayload
} from "@/lib/perfectcorp/modules/jewelry";
import { applyNails } from "@/lib/perfectcorp/modules/nails";
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
import type { HairTransferTaskPayload } from "@/lib/hair/build-hair-transfer-payload";
import type { NailVtoTaskPayload } from "@/types/nail-api";
import { getV2ApiKey } from "@/lib/perfectcorp/api-env";
import {
  ensurePerfectCorpFileId,
  ensurePerfectCorpFileIds
} from "@/lib/perfectcorp/ensure-pc-file-id";
import { createTask, getTask, normaliseTaskStatus } from "@/lib/perfectcorp/task-engine";
import { KvCache } from "@/lib/storage/kv";
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
  return {
    src_file_id: body.src_file_id,
    ref_file_id: typeof body.ref_file_id === "string" ? body.ref_file_id : undefined,
    ref_file_url: typeof body.ref_file_url === "string" ? body.ref_file_url : undefined,
    gender: body.gender === "male" ? "male" : "female"
  };
}

function parseHairTransferPayload(body: Record<string, unknown>): HairTransferTaskPayload | null {
  if (typeof body.src_file_id !== "string") {
    return null;
  }
  if (
    typeof body.template_id === "string" ||
    typeof body.ref_file_id === "string" ||
    typeof body.ref_file_url === "string"
  ) {
    return body as unknown as HairTransferTaskPayload;
  }
  return null;
}

function parseNailVtoPayload(body: Record<string, unknown>): NailVtoTaskPayload | null {
  if (
    body.version !== "1.0" ||
    typeof body.src_file_id !== "string" ||
    typeof body.effect_type !== "string" ||
    !Array.isArray(body.effects)
  ) {
    return null;
  }
  return body as unknown as NailVtoTaskPayload;
}

function parseJewelryPayload(body: Record<string, unknown>): JewelryVtoPayload | null {
  if (typeof body.src_file_id !== "string") {
    return null;
  }
  if (!body.ref_file_id && !body.ref_file_url) {
    return null;
  }
  return body as unknown as JewelryVtoPayload;
}

async function resolvePayloadFileIds(
  module: string,
  kvCache: KvCache,
  payload: {
    src_file_id: string;
    ref_file_id?: string;
  }
) {
  payload.src_file_id = await ensurePerfectCorpFileId(module, payload.src_file_id, kvCache);
  if (typeof payload.ref_file_id === "string") {
    payload.ref_file_id = await ensurePerfectCorpFileId(module, payload.ref_file_id, kvCache);
  }
}

async function resolveNailPayloadFileIds(
  module: string,
  kvCache: KvCache,
  payload: NailVtoTaskPayload
) {
  payload.src_file_id = await ensurePerfectCorpFileId(module, payload.src_file_id, kvCache);
  if (payload.ref_file_ids?.length) {
    payload.ref_file_ids = await ensurePerfectCorpFileIds(module, payload.ref_file_ids, kvCache);
  }
}

function sendTaskError(
  message: string,
  send: (event: string, data: unknown) => void,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  send("error", { message });
  controller.close();
}

async function completeVtoTask(
  module: string,
  result: { task_id: string | null; result_url: string | null; dst_id: string | null },
  payload: unknown,
  send: (event: string, data: unknown) => void,
  controller: ReadableStreamDefaultController<Uint8Array>,
  runStub: typeof runStubTask
) {
  if (result.task_id && result.result_url) {
    send("task_started", { module, task_id: result.task_id, task_status: "processing" });
    send("task_complete", {
      task_id: result.task_id,
      task_status: "success",
      result_url: result.result_url,
      dst_id: result.dst_id
    });
    controller.close();
    return true;
  }
  if (result.dst_id && !getV2ApiKey()) {
    await runStub(
      module,
      typeof payload === "string" ? payload : JSON.stringify(payload),
      send
    );
    controller.close();
    return true;
  }
  return false;
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
  const kvCache = new KvCache();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      try {
        if (makeupPayload) {
          validateEffects(makeupPayload.effects as MakeupApiEffect[]);
          send("progress", { step: "validating" });
          await resolvePayloadFileIds(module, kvCache, makeupPayload);

          const result = await applyMakeup(makeupPayload);
          if (
            await completeVtoTask(
              module,
              {
                task_id: result.task_id,
                result_url: result.result_url,
                dst_id: result.dst_id ?? null
              },
              makeupPayload,
              send,
              controller,
              runStubTask
            )
          ) {
            return;
          }
          sendTaskError("Makeup VTO did not return a result image.", send, controller);
          return;
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

          if (!getV2ApiKey()) {
            await runStubTask(
              module,
              `${body.prompt}:${body.slot_id ?? "item"}`,
              send
            );
            controller.close();
            return;
          }
          sendTaskError("Image generation did not return a result.", send, controller);
          return;
        }

        if (module === "cloth") {
          const payload = parseClothPayload(body);
          if (payload) {
            send("progress", { step: "try-on" });
            await resolvePayloadFileIds(module, kvCache, payload);
            const result = await applyCloth(payload);
            if (
              await completeVtoTask(module, result, payload, send, controller, runStubTask)
            ) {
              return;
            }
            sendTaskError("Cloth VTO did not return a result image.", send, controller);
            return;
          }
        }

        if (module === "hair-transfer") {
          const payload = parseHairTransferPayload(body);
          if (payload) {
            send("progress", { step: "hair-transfer" });
            await resolvePayloadFileIds(module, kvCache, payload);
            const result = await applyHairTransfer(payload);
            if (
              await completeVtoTask(module, result, payload, send, controller, runStubTask)
            ) {
              return;
            }
            sendTaskError("Hair transfer did not return a result image.", send, controller);
            return;
          }
        }

        if (module === "nail-vto") {
          const payload = parseNailVtoPayload(body);
          if (payload) {
            send("progress", { step: "nail-vto" });
            await resolveNailPayloadFileIds(module, kvCache, payload);
            const result = await applyNails(payload);
            if (
              await completeVtoTask(module, result, payload, send, controller, runStubTask)
            ) {
              return;
            }
            sendTaskError("Nail VTO did not return a result image.", send, controller);
            return;
          }
        }

        if (module === "ring") {
          const payload = parseJewelryPayload(body);
          if (payload) {
            send("progress", { step: "ring" });
            await resolvePayloadFileIds(module, kvCache, payload);
            const result = await applyRing(payload);
            if (
              await completeVtoTask(module, result, payload, send, controller, runStubTask)
            ) {
              return;
            }
          }
        }

        if (module === "bracelet") {
          const payload = parseJewelryPayload(body);
          if (payload) {
            send("progress", { step: "bracelet" });
            await resolvePayloadFileIds(module, kvCache, payload);
            const result = await applyBracelet(payload);
            if (
              await completeVtoTask(module, result, payload, send, controller, runStubTask)
            ) {
              return;
            }
          }
        }

        if (module === "watch") {
          const payload = parseJewelryPayload(body);
          if (payload) {
            send("progress", { step: "watch" });
            await resolvePayloadFileIds(module, kvCache, payload);
            const result = await applyWatch(payload);
            if (
              await completeVtoTask(module, result, payload, send, controller, runStubTask)
            ) {
              return;
            }
          }
        }

        if (module === "necklace") {
          const payload = parseJewelryPayload(body);
          if (payload) {
            send("progress", { step: "necklace" });
            await resolvePayloadFileIds(module, kvCache, payload);
            const result = await applyNecklace(payload);
            if (
              await completeVtoTask(module, result, payload, send, controller, runStubTask)
            ) {
              return;
            }
          }
        }

        if (module === "hat" || module === "bag" || module === "shoes") {
          const payload = parseAccessoryPayload(body);
          if (payload) {
            send("progress", { step: "try-on" });
            await resolvePayloadFileIds(module, kvCache, payload);
            const applyFn =
              module === "hat" ? applyHat : module === "bag" ? applyBag : applyShoes;
            const result = await applyFn(payload);
            if (
              await completeVtoTask(module, result, payload, send, controller, runStubTask)
            ) {
              return;
            }
            sendTaskError(`${module} VTO did not return a result image.`, send, controller);
            return;
          }
        }

        if (!getV2ApiKey()) {
          const stubSeed =
            requestSeed ??
            (module === "makeup-vto" && Array.isArray(body.effects)
              ? JSON.stringify(body.effects)
              : undefined);
          await runStubTask(module, stubSeed, send);
        } else {
          sendTaskError(
            "Task did not produce a result. Check uploads and configuration, then try again.",
            send,
            controller
          );
          return;
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
