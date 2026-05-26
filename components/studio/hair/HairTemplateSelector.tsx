"use client";

import Image from "next/image";
import type { HairTransferTemplate } from "@/types/hair";

interface HairTemplateSelectorProps {
  templates: HairTransferTemplate[];
  selectedId?: string;
  onSelect: (template: HairTransferTemplate) => void;
  loading?: boolean;
}

export default function HairTemplateSelector({
  templates,
  selectedId,
  onSelect,
  loading = false
}: HairTemplateSelectorProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[3/4] animate-pulse rounded-xl border border-mint-200 bg-mint-50/60"
          />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return <p className="text-xs text-plum-700/60">No hairstyle templates available.</p>;
  }

  return (
    <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
      {templates.map((template) => {
        const isSelected = selectedId === template.id;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            title={template.title}
            className={`overflow-hidden rounded border text-left transition ${
              isSelected
                ? "border-magenta-500 ring-2 ring-magenta-400/30"
                : "border-mint-200 bg-mint-50/50 hover:border-mint-500"
            }`}
          >
            <div className="relative aspect-[3/4] bg-mint-100">
              <Image
                src={template.thumb}
                alt={template.title}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="truncate px-1 py-1 text-[10px] text-plum-700/70">{template.title}</p>
          </button>
        );
      })}
    </div>
  );
}
