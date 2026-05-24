"use client";

import type { HairSection } from "@/constants/hair-slots";
import { HAIR_SECTION_LABEL } from "@/constants/hair-slots";

interface HairSectionTabsProps {
  selected: HairSection;
  onSelect: (section: HairSection) => void;
}

const SECTIONS: HairSection[] = ["hairstyle", "color"];

export default function HairSectionTabs({ selected, onSelect }: HairSectionTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SECTIONS.map((section) => (
        <button
          key={section}
          type="button"
          onClick={() => onSelect(section)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            selected === section
              ? "border-white bg-white text-black"
              : "border-gray-600 text-gray-300 hover:border-gray-400"
          }`}
        >
          {HAIR_SECTION_LABEL[section]}
        </button>
      ))}
    </div>
  );
}
