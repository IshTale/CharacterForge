"use client";

const FINGERS = ["thumb", "index", "middle", "ring", "pinky"] as const;
type Finger = (typeof FINGERS)[number] | "all";

interface HandMapSelectorProps {
  selected: Finger;
  onSelect: (finger: Finger) => void;
}

export default function HandMapSelector({ selected, onSelect }: HandMapSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={`rounded border px-2 py-1 text-xs ${selected === "all" ? "border-white" : "border-gray-700"}`}
        onClick={() => onSelect("all")}
      >
        all
      </button>
      {FINGERS.map((finger) => (
        <button
          key={finger}
          type="button"
          className={`rounded border px-2 py-1 text-xs ${
            selected === finger ? "border-white" : "border-gray-700"
          }`}
          onClick={() => onSelect(finger)}
        >
          {finger}
        </button>
      ))}
    </div>
  );
}
