import type { CanvasKey } from "@/types/canvas";

export interface CanvasUploadRequirement {
  label: string;
  poseHint: string;
  maxLongSidePx: number;
  maxFileSizeMb: number;
  formats: string;
}

export const CANVAS_UPLOAD_REQUIREMENTS: Record<CanvasKey, CanvasUploadRequirement> = {
  headshot: {
    label: "Headshot",
    poseHint: "Face-forward, well-lit. Face width ≥ 100px.",
    maxLongSidePx: 1920,
    maxFileSizeMb: 10,
    formats: "JPG, JPEG, PNG"
  },
  fullbody: {
    label: "Full Body",
    poseHint: "Full standing pose with shoulders visible.",
    maxLongSidePx: 2048,
    maxFileSizeMb: 10,
    formats: "JPG, JPEG, PNG"
  },
  handwrist: {
    label: "Hand & Wrist",
    poseHint: "Back of one hand with wrist visible. Keep fingers and wrist unobstructed.",
    maxLongSidePx: 2048,
    maxFileSizeMb: 10,
    formats: "JPG, JPEG, PNG"
  },
  feet: {
    label: "Feet",
    poseHint: "Straight-on view with both feet visible.",
    maxLongSidePx: 1500,
    maxFileSizeMb: 10,
    formats: "JPG, JPEG, PNG"
  }
};
