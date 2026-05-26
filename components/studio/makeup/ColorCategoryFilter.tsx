"use client";

interface ColorCategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function ColorCategoryFilter({
  categories,
  selected,
  onSelect
}: ColorCategoryFilterProps) {
  if (categories.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={`rounded-full border px-3 py-1 text-xs ${
          selected === "all"
            ? "border-magenta-500 bg-magenta-500 text-white"
            : "border-mint-300 bg-white/50 text-plum-700 hover:border-magenta-400"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className={`rounded-full border px-3 py-1 text-xs ${
            selected === category
              ? "border-magenta-500 bg-magenta-500 text-white"
              : "border-mint-300 bg-white/50 text-plum-700 hover:border-magenta-400"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
