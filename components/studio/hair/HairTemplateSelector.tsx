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
            className="aspect-[3/4] animate-pulse rounded border border-gray-800 bg-gray-800/60"
          />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return <p className="text-xs text-gray-500">No hairstyle templates available.</p>;
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
              isSelected ? "border-white ring-1 ring-white" : "border-gray-700 hover:border-gray-500"
            }`}
          >
            <div className="relative aspect-[3/4] bg-gray-900">
              <Image
                src={template.thumb}
                alt={template.title}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="truncate px-1 py-1 text-[10px] text-gray-400">{template.title}</p>
          </button>
        );
      })}
    </div>
  );
}
