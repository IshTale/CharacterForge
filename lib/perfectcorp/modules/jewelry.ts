import { postAndPollV2Task } from "@/lib/perfectcorp/v2-task-client";

export interface JewelryVtoPayload {
  src_file_id: string;
  ref_file_id?: string;
  ref_file_url?: string;
  finger?: string;
  wrist?: "left" | "right";
}

function refFields(payload: JewelryVtoPayload) {
  if (payload.ref_file_id) {
    return { ref_file_id: payload.ref_file_id };
  }
  if (payload.ref_file_url) {
    return { ref_file_url: payload.ref_file_url };
  }
  throw new Error("Jewelry reference image is required.");
}

export async function applyRing(payload: JewelryVtoPayload) {
  return postAndPollV2Task(
    "/task/ring",
    {
      src_file_id: payload.src_file_id,
      ...refFields(payload),
      finger: payload.finger ?? "ring"
    },
    { stubPrefix: "ring" }
  );
}

export async function applyBracelet(payload: JewelryVtoPayload) {
  return postAndPollV2Task(
    "/task/bracelet",
    {
      src_file_id: payload.src_file_id,
      ...refFields(payload),
      wrist: payload.wrist ?? "left"
    },
    { stubPrefix: "bracelet" }
  );
}

export async function applyWatch(payload: JewelryVtoPayload) {
  return postAndPollV2Task(
    "/task/watch",
    {
      src_file_id: payload.src_file_id,
      ...refFields(payload),
      wrist: payload.wrist ?? "left"
    },
    { stubPrefix: "watch" }
  );
}

export async function applyNecklace(payload: JewelryVtoPayload) {
  return postAndPollV2Task(
    "/task/necklace",
    {
      src_file_id: payload.src_file_id,
      ...refFields(payload)
    },
    { stubPrefix: "necklace" }
  );
}
