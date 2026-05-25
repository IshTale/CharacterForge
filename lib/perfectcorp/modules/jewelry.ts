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

function refName(payload: JewelryVtoPayload) {
  const ref = refFields(payload);
  return ref.ref_file_id ?? ref.ref_file_url;
}

function sourceObjectPayload(
  payload: JewelryVtoPayload,
  parameter: Record<string, unknown>
) {
  return {
    source_info: {
      name: payload.src_file_id
    },
    object_infos: [
      {
        name: refName(payload),
        parameter
      }
    ]
  };
}

function ringFingerIndex(finger: string | undefined) {
  const fingerMap: Record<string, number> = {
    thumb: 0,
    index: 1,
    middle: 2,
    ring: 3,
    pinky: 4,
    little: 4
  };
  return fingerMap[finger ?? "ring"] ?? 3;
}

export async function applyRing(payload: JewelryVtoPayload) {
  return postAndPollV2Task(
    "/task/2d-vto/ring",
    sourceObjectPayload(payload, {
      ring_need_remove_background: true,
      ring_anchor_point: null,
      ring_wearing_finger: ringFingerIndex(payload.finger),
      ring_wearing_location: null,
      ring_shadow_intensity: 0.15,
      ring_ambient_light_intensity: 1
    }),
    { stubPrefix: "ring" }
  );
}

export async function applyBracelet(payload: JewelryVtoPayload) {
  return postAndPollV2Task(
    "/task/2d-vto/bracelet",
    sourceObjectPayload(payload, {
      bracelet_need_remove_background: true,
      bracelet_anchor_point: null,
      bracelet_wearing_location: null,
      bracelet_shadow_intensity: 0.3,
      bracelet_ambient_light_intensity: 1
    }),
    { stubPrefix: "bracelet" }
  );
}

export async function applyWatch(payload: JewelryVtoPayload) {
  return postAndPollV2Task(
    "/task/2d-vto/watch",
    sourceObjectPayload(payload, {
      watch_need_remove_background: true,
      watch_anchor_point: null,
      watch_wearing_location: null,
      watch_shadow_intensity: 0.3,
      watch_ambient_light_intensity: 1
    }),
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
