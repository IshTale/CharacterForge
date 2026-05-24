"use client";

import type { MakeupRegion } from "@/types/recipe";

interface RegionButton {
  id: MakeupRegion;
  label: string;
  top: string;
  left: string;
}

const REGION_BUTTONS: RegionButton[] = [
  { id: "foundation", label: "Foundation", top: "36%", left: "50%" },
  { id: "concealer", label: "Concealer", top: "46%", left: "38%" },
  { id: "blush", label: "Blush", top: "56%", left: "33%" },
  { id: "bronzer", label: "Bronzer", top: "54%", left: "67%" },
  { id: "contour", label: "Contour", top: "50%", left: "64%" },
  { id: "highlighter", label: "Highlighter", top: "43%", left: "63%" },
  { id: "eyebrows", label: "Eyebrows", top: "30%", left: "50%" },
  { id: "eye_shadow", label: "Eye Shadow", top: "34%", left: "40%" },
  { id: "eye_liner", label: "Eye Liner", top: "38%", left: "41%" },
  { id: "eyelashes", label: "Eyelashes", top: "41%", left: "43%" },
  { id: "lip_color", label: "Lip Color", top: "68%", left: "50%" },
  { id: "lip_liner", label: "Lip Liner", top: "72%", left: "49%" },
  { id: "skin_smooth", label: "Skin Smooth", top: "82%", left: "50%" }
];

interface FaceRegionMapProps {
  selectedRegion: MakeupRegion;
  onSelect: (region: MakeupRegion) => void;
}

export default function FaceRegionMap({ selectedRegion, onSelect }: FaceRegionMapProps) {
  return (
    <div className="rounded-xl border border-gray-700 p-4">
      <p className="mb-3 text-sm text-gray-300">Click a face region to edit makeup settings.</p>
      <div className="relative mx-auto h-[430px] w-[290px]">
        <div className="absolute inset-0 rounded-[45%] border border-gray-600 bg-gradient-to-b from-gray-900 to-gray-950" />
        {REGION_BUTTONS.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => onSelect(button.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[10px] ${
              selectedRegion === button.id
                ? "border-white bg-white text-black"
                : "border-gray-500 bg-black/70 text-gray-200"
            }`}
            style={{ top: button.top, left: button.left }}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}
