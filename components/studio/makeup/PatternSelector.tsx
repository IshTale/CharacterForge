"use client";

import Image from "next/image";
import type { MakeupPatternEntry } from "@/types/makeup";

interface PatternSelectorProps {
  patterns: MakeupPatternEntry[];
  selected?: string;
  onSelect: (pattern: MakeupPatternEntry) => void;
  loading?: boolean;
}

export default function PatternSelector({
  patterns,
  selected,
  onSelect,
  loading = false
}: PatternSelectorProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-xl border border-mint-200 bg-mint-50/60"
          />
        ))}
      </div>
    );
  }

  if (patterns.length === 0) {
    return <p className="text-xs text-plum-700/60">No patterns available.</p>;
  }

  return (
    <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
      {patterns.map((pattern) => {
        const isSelected = selected === pattern.label;

        return (
          <button
            key={pattern.label}
            type="button"
            onClick={() => onSelect(pattern)}
            title={pattern.label}
            className={`overflow-hidden rounded border text-left transition ${
              isSelected
                ? "border-magenta-500 ring-2 ring-magenta-400/30"
                : "border-mint-200 bg-mint-50/50 hover:border-mint-500"
            }`}
          >
            <div className="relative aspect-square bg-mint-100">
              <Image
                src={pattern.thumbnail}
                alt={pattern.label}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="truncate px-1 py-1 text-[10px] text-plum-700/70">{pattern.label}</p>
          </button>
        );
      })}
    </div>
  );
}
