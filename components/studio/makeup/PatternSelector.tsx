"use client";

interface PatternSelectorProps {
  patterns: string[];
  selected?: string;
  onSelect: (name: string) => void;
}

export default function PatternSelector({ patterns, selected, onSelect }: PatternSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {patterns.map((pattern) => (
        <button
          key={pattern}
          type="button"
          onClick={() => onSelect(pattern)}
          className={`rounded border px-2 py-1 text-xs ${
            selected === pattern ? "border-white" : "border-gray-700"
          }`}
        >
          {pattern}
        </button>
      ))}
    </div>
  );
}
