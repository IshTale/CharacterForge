import { NextResponse } from "next/server";
import { MODULE_CONFIG } from "@/constants/api-modules";
import { getTask, normaliseTaskStatus } from "@/lib/perfectcorp/task-engine";

interface RouteContext {
  params: Promise<{ module: string; id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { module, id } = await context.params;
  if (!MODULE_CONFIG[module]) {
    return NextResponse.json({ error: `Unsupported module: ${module}` }, { status: 400 });
  }

  const task = getTask(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  return NextResponse.json({
    module,
    task_id: task.task_id,
    task_status: normaliseTaskStatus(task.task_status),
    result_url: task.result_url
  });
}
