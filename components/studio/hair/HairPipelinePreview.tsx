import { Fragment } from "react";
import { HAIR_PIPELINE_ORDER } from "@/constants/hair-slots";
import type { HairConfig } from "@/types/recipe";

interface HairPipelinePreviewProps {
  hair: HairConfig;
}

const LABELS = {
  transfer: "Hairstyle",
  color: "Color"
} as const satisfies Record<(typeof HAIR_PIPELINE_ORDER)[number], string>;

export default function HairPipelinePreview({ hair }: HairPipelinePreviewProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {HAIR_PIPELINE_ORDER.map((stage, index) => {
        const active = Boolean(hair[stage]);
        return (
          <Fragment key={stage}>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"
              }`}
            >
              {LABELS[stage]}
            </span>
            {index < HAIR_PIPELINE_ORDER.length - 1 && (
              <span className="text-gray-600" aria-hidden>
                →
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
