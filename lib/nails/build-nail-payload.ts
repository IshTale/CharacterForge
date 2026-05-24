import type { NailVtoFinger, NailVtoTaskPayload } from "@/types/nail-api";
import { activeNailStyle, type NailsConfig, type NailFinger } from "@/types/nails";

const ALL_FINGERS: NailVtoFinger[] = ["thumb", "index", "middle", "ring", "pinky"];

function toVtoFinger(finger: Exclude<NailFinger, "all">): NailVtoFinger {
  return finger;
}

export function buildNailVtoPayload(srcFileId: string, config: NailsConfig): NailVtoTaskPayload {
  const active = activeNailStyle(config);
  const refFileId = active.custom_texture_file_id;
  const refUrl = active.custom_texture_url;

  if (!refFileId && !refUrl) {
    throw new Error("Upload nail art before applying.");
  }

  const fingers: NailVtoFinger[] =
    config.apply_to === "all" ? ALL_FINGERS : [toVtoFinger(config.apply_to)];

  const reflection = Math.min(100, Math.max(0, active.intensity ?? 90));

  const effects = fingers.map((finger) => ({
    sub_type: "design" as const,
    finger,
    texture: "cream",
    reflection,
    contrast: 50,
    roughness: 0,
    ...(refFileId ? { ref_file_index: 0 } : { ref_file_url: refUrl! })
  }));

  return {
    version: "1.0",
    src_file_id: srcFileId,
    effect_type: "press_on_nails",
    ...(refFileId ? { ref_file_ids: [refFileId] } : {}),
    effects
  };
}
