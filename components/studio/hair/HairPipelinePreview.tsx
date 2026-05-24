interface HairPipelinePreviewProps {
  activeStages: string[];
}

const ORDER = ["style", "color", "extension", "bangs", "volume"];

export default function HairPipelinePreview({ activeStages }: HairPipelinePreviewProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ORDER.map((stage) => {
        const active = activeStages.includes(stage);
        return (
          <span
            key={stage}
            className={`rounded px-2 py-1 text-xs ${
              active ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400"
            }`}
          >
            {stage}
          </span>
        );
      })}
    </div>
  );
}
