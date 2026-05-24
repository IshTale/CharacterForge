"use client";

const FINGERS = ["thumb", "index", "middle", "ring", "pinky"] as const;
type Finger = (typeof FINGERS)[number] | "all";

interface HandMapSelectorProps {
  selected: Finger;
  onSelect: (finger: Finger) => void;
}

const OPTIONS: Array<{ id: Finger; label: string }> = [
  { id: "all", label: "All" },
  ...FINGERS.map((finger) => ({ id: finger, label: finger }))
];

export default function HandMapSelector({ selected, onSelect }: HandMapSelectorProps) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-lg border border-gray-700 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition ${
            selected === option.id
              ? "bg-white text-black"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
