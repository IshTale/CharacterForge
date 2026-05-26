import { HAIR_PIPELINE_ORDER, HAIR_PIPELINE_LABEL } from "@/constants/hair-slots";
import type { HairConfig } from "@/types/recipe";

interface HairPipelinePreviewProps {
  hair: HairConfig;
}

export default function HairPipelinePreview({ hair }: HairPipelinePreviewProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {HAIR_PIPELINE_ORDER.map((stage) => {
        const active = Boolean(hair[stage]);
        return (
          <span
            key={stage}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              active ? "bg-magenta-500 text-white" : "bg-mint-100 text-plum-700/60"
            }`}
          >
            {HAIR_PIPELINE_LABEL[stage]}
          </span>
        );
      })}
    </div>
  );
}
