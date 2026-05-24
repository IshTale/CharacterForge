import type { CanvasKey } from "@/types/canvas";
import type { JewelryConfig } from "@/types/recipe";

export interface JewelryRef {
  ref_file_id?: string;
  ref_image_url?: string;
}

export interface JewelryPipelineStep {
  module: "ring" | "bracelet" | "watch" | "necklace";
  canvas: CanvasKey;
  label: string;
  payload: {
    src_file_id: string;
    ref_file_id?: string;
    ref_file_url?: string;
    finger?: string;
    wrist?: "left" | "right";
  };
}

function refFrom(entry: JewelryRef | null | undefined) {
  if (!entry) {
    return null;
  }
  if (entry.ref_file_id) {
    return { ref_file_id: entry.ref_file_id };
  }
  if (entry.ref_image_url) {
    return { ref_file_url: entry.ref_image_url };
  }
  return null;
}

export function buildJewelryPipelineSteps(
  jewelry: JewelryConfig,
  fileIds: { handwrist: string | null; headshot: string | null }
): JewelryPipelineStep[] {
  const steps: JewelryPipelineStep[] = [];

  if (fileIds.handwrist) {
    for (const ring of jewelry.rings) {
      const ref = refFrom(ring);
      if (!ref) {
        continue;
      }
      steps.push({
        module: "ring",
        canvas: "handwrist",
        label: `Ring (${ring.finger})`,
        payload: {
          src_file_id: fileIds.handwrist,
          ...ref,
          finger: ring.finger
        }
      });
    }

    for (const bracelet of jewelry.bracelets) {
      const ref = refFrom(bracelet);
      if (!ref) {
        continue;
      }
      steps.push({
        module: "bracelet",
        canvas: "handwrist",
        label: `Bracelet (${bracelet.wrist})`,
        payload: {
          src_file_id: fileIds.handwrist,
          ...ref,
          wrist: bracelet.wrist
        }
      });
    }

    if (jewelry.watch) {
      const ref = refFrom(jewelry.watch);
      if (ref) {
        steps.push({
          module: "watch",
          canvas: "handwrist",
          label: `Watch (${jewelry.watch.wrist})`,
          payload: {
            src_file_id: fileIds.handwrist,
            ...ref,
            wrist: jewelry.watch.wrist
          }
        });
      }
    }
  }

  if (fileIds.headshot && jewelry.necklace) {
    const ref = refFrom(jewelry.necklace);
    if (ref) {
      steps.push({
        module: "necklace",
        canvas: "headshot",
        label: "Necklace",
        payload: {
          src_file_id: fileIds.headshot,
          ...ref
        }
      });
    }
  }

  return steps;
}

export function jewelryHasSelection(jewelry: JewelryConfig): boolean {
  const hasRef = (entry: JewelryRef | null | undefined) =>
    Boolean(entry?.ref_file_id || entry?.ref_image_url);

  return (
    jewelry.rings.some(hasRef) ||
    jewelry.bracelets.some(hasRef) ||
    hasRef(jewelry.watch) ||
    hasRef(jewelry.necklace)
  );
}

export function validateJewelryPipeline(
  jewelry: JewelryConfig,
  fileIds: { handwrist: string | null; headshot: string | null }
): string | null {
  const steps = buildJewelryPipelineSteps(jewelry, fileIds);
  if (steps.length === 0) {
    return null;
  }

  const needsHand = steps.some((step) => step.canvas === "handwrist");
  const needsHead = steps.some((step) => step.canvas === "headshot");

  if (needsHand && !fileIds.handwrist) {
    return "Upload a hand & wrist photo before applying jewelry.";
  }
  if (needsHead && !fileIds.headshot) {
    return "Upload a headshot before applying a necklace.";
  }

  return null;
}
