import { postAndPollV2Task } from "@/lib/perfectcorp/v2-task-client";
import type { NailVtoTaskPayload } from "@/types/nail-api";

export async function applyNails(payload: NailVtoTaskPayload) {
  return postAndPollV2Task("/task/nail-vto", payload as unknown as Record<string, unknown>, {
    stubPrefix: "nail-vto"
  });
}
