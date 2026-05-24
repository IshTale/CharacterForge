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
          selected === "all" ? "border-white bg-white text-black" : "border-gray-600 text-gray-300"
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
            selected === category ? "border-white bg-white text-black" : "border-gray-600 text-gray-300"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
