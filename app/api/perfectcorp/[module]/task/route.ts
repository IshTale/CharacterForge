import { NextResponse } from "next/server";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { createTask, getTask, normaliseTaskStatus } from "@/lib/perfectcorp/task-engine";

interface RouteContext {
  params: Promise<{ module: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { module } = await context.params;
  if (!MODULE_CONFIG[module]) {
    return NextResponse.json({ error: `Unsupported module: ${module}` }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const requestSeed = typeof body.request_id === "string" ? body.request_id : undefined;
  const task = createTask(module, requestSeed);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

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
          result_url: finalTask.result_url
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
