"use client";

import { useState } from "react";
import type { MakeupRegion } from "@/types/recipe";

interface RegionButton {
  id: MakeupRegion;
  label: string;
  top: string;
  left: string;
}

// Coordinates meticulously calculated to sit exactly at the center of the highlight zones
const REGION_BUTTONS: RegionButton[] = [
  // Center Column
  { id: "bronzer", label: "Bronzer", top: "14%", left: "50%" }, // Center forehead arc
  { id: "lip_color", label: "Lip Color", top: "73%", left: "50%" }, // Center of lips
  { id: "lip_liner", label: "Lip Liner", top: "77.5%", left: "50%" }, // Bottom lip edge
  { id: "foundation", label: "Foundation", top: "88%", left: "50%" }, // Chin (Clear base skin area)

  // Left Side (Eye Details - centered perfectly on the left eye)
  { id: "eyebrows", label: "Eyebrows", top: "31.6%", left: "34%" },
  { id: "eye_shadow", label: "Eye Shadow", top: "34.3%", left: "34%" },
  { id: "eye_liner", label: "Eye Liner", top: "37.5%", left: "34%" },
  { id: "eyelashes", label: "Eyelashes", top: "41.6%", left: "34%" },
  { id: "concealer", label: "Concealer", top: "44.5%", left: "34%" },

  // Right Side (Cheek Details - centered perfectly on the right cheek)
  { id: "highlighter", label: "Highlighter", top: "46.8%", left: "75%" },
  { id: "blush", label: "Blush", top: "56.2%", left: "72%" },
  { id: "contour", label: "Contour", top: "65.6%", left: "75%" }
];

interface FaceRegionMapProps {
  selectedRegion: MakeupRegion;
  onSelect: (region: MakeupRegion) => void;
}

export default function FaceRegionMap({ selectedRegion, onSelect }: FaceRegionMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<MakeupRegion | null>(null);

  // Dynamically switch between Fill highlights (for areas) and Stroke highlights (for lines)
  const getHighlightProps = (regionId: MakeupRegion, isArea = false) => {
    const isHovered = regionId === hoveredRegion;
    const isSelected = regionId === selectedRegion;
    const isActive = isHovered || isSelected;

    if (!isActive) {
      return {
        stroke: "none",
        fill: "none",
        className: "transition-all duration-300 opacity-0",
      };
    }

    if (isArea) {
      return {
        stroke: "none",
        fill: "white",
        className: "transition-all duration-300",
        style: {
          opacity: isSelected ? 0.3 : 0.15,
          filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8)) blur(4px)",
        },
      };
    }

    return {
      stroke: "white",
      strokeWidth: isSelected ? "4" : "2.5",
      fill: "none",
      strokeLinecap: "round" as const,
      className: "transition-all duration-300",
      style: {
        opacity: isSelected ? 1 : 0.7,
        filter: isSelected ? "drop-shadow(0 0 6px white)" : "drop-shadow(0 0 4px rgba(255,255,255,0.6))",
      },
    };
  };

  // Helper to display the currently active region name at the top
  const activeLabel = hoveredRegion
    ? REGION_BUTTONS.find((r) => r.id === hoveredRegion)?.label
    : REGION_BUTTONS.find((r) => r.id === selectedRegion)?.label;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 shadow-xl">
      {/* Dynamic Header */}
      <div className="mb-4 h-6 text-center">
        {activeLabel ? (
          <p className="text-sm font-bold tracking-widest text-white uppercase">{activeLabel}</p>
        ) : (
          <p className="text-sm font-medium text-gray-500">Select a region to edit</p>
        )}
      </div>

      <div className="relative mx-auto h-[480px] w-[340px]">
        {/* SVG Mannequin Face Background */}
        <svg
          viewBox="0 0 340 480"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 h-full w-full opacity-90 drop-shadow-md"
        >
          {/* Base Face Shape */}
          <path
            d="M170 30 C70 30 20 120 20 220 C20,340 80,440 170,440 C260,440 320,340 320,220 C320,120 270,30 170,30Z"
            fill="#1f2937"
            stroke="#374151"
            strokeWidth="2.5"
          />

          {/* ================= HIGHLIGHT ZONES ================= */}

          {/* Foundation Area Highlight */}
          <path
            d="M170 30 C70 30 20 120 20 220 C20,340 80,440 170,440 C260,440 320,340 320,220 C320,120 270,30 170,30Z"
            {...getHighlightProps("foundation", true)}
          />

          {/* Bronzer Area (Forehead & Temples) */}
          <path d="M 50 150 Q 170 -20 290 150 Q 170 50 50 150 Z" {...getHighlightProps("bronzer", true)} />

          {/* Blush Area */}
          <circle cx="95" cy="270" r="28" {...getHighlightProps("blush", true)} />
          <circle cx="245" cy="270" r="28" {...getHighlightProps("blush", true)} />

          {/* Highlighter Area */}
          <path d="M 60 230 Q 90 240 110 220 Q 80 210 60 230 Z" {...getHighlightProps("highlighter", true)} />
          <path d="M 280 230 Q 250 240 230 220 Q 260 210 280 230 Z" {...getHighlightProps("highlighter", true)} />
          <circle cx="170" cy="275" r="8" {...getHighlightProps("highlighter", true)} />

          {/* Contour Area */}
          <path d="M 50 300 Q 100 320 120 330" {...getHighlightProps("contour")} />
          <path d="M 290 300 Q 240 320 220 330" {...getHighlightProps("contour")} />
          <path d="M 155 230 L 155 280 M 185 230 L 185 280" {...getHighlightProps("contour")} />

          {/* Concealer Area (Under Eyes) */}
          <path d="M 85 200 C 100 225 130 215 145 195 C 130 205 100 205 85 200 Z" {...getHighlightProps("concealer", true)} />
          <path d="M 255 200 C 240 225 210 215 195 195 C 210 205 240 205 255 200 Z" {...getHighlightProps("concealer", true)} />

          {/* Eye Shadow Area */}
          <path d="M 85 180 C 85 150 145 150 145 180 Z" {...getHighlightProps("eye_shadow", true)} />
          <path d="M 255 180 C 255 150 195 150 195 180 Z" {...getHighlightProps("eye_shadow", true)} />

          {/* ================= BASE FACIAL FEATURES ================= */}

          {/* Eyebrows */}
          <path d="M 90 160 Q 115 145 140 160" stroke="#4b5563" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 90 160 Q 115 145 140 160" {...getHighlightProps("eyebrows")} />

          <path d="M 250 160 Q 225 145 200 160" stroke="#4b5563" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 250 160 Q 225 145 200 160" {...getHighlightProps("eyebrows")} />

          {/* Eyes Base */}
          <ellipse cx="115" cy="190" rx="18" ry="9" fill="#1c2533" stroke="#4b5563" strokeWidth="1.2" />
          <ellipse cx="225" cy="190" rx="18" ry="9" fill="#1c2533" stroke="#4b5563" strokeWidth="1.2" />

          {/* Eye Liner (Upper Lash Line) */}
          <path d="M 97 182 Q 115 178 133 182" {...getHighlightProps("eye_liner")} />
          <path d="M 243 182 Q 225 178 207 182" {...getHighlightProps("eye_liner")} />

          {/* Eyelashes (Lower Line) */}
          <path d="M 97 198 Q 115 202 133 198" {...getHighlightProps("eyelashes")} />
          <path d="M 243 198 Q 225 202 207 198" {...getHighlightProps("eyelashes")} />

          {/* Nose */}
          <path d="M 170 190 L 170 275 Q 182 285 170 290 Q 158 285 170 275" stroke="#374151" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* Lips Base */}
          <path d="M 125 350 Q 170 335 215 350 Q 170 375 125 350 Z" fill="#1c2533" stroke="#4b5563" strokeWidth="1.2" />

          {/* Lip Color Highlight */}
          <path d="M 125 350 Q 170 335 215 350 Q 170 375 125 350 Z" {...getHighlightProps("lip_color", true)} />

          {/* Lip Liner Highlight */}
          <path d="M 125 350 Q 170 335 215 350 Q 170 375 125 350 Z" {...getHighlightProps("lip_liner")} />
          <path d="M 125 350 Q 170 355 215 350" stroke="#4b5563" strokeWidth="1.2" fill="none" />

          {/* Neck */}
          <path d="M 115 430 L 115 480 L 225 480 L 225 430" fill="#1f2937" stroke="#374151" strokeWidth="2.5" />
        </svg>

        {/* Minimalist Hover Dots */}
        {REGION_BUTTONS.map((button) => {
          const isSelected = selectedRegion === button.id;

          return (
            <button
              key={button.id}
              type="button"
              onClick={() => onSelect(button.id)}
              onMouseEnter={() => setHoveredRegion(button.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 p-2 group z-10 outline-none"
              style={{ top: button.top, left: button.left }}
              aria-label={button.label}
            >
              <div className={`h-2.5 w-2.5 rounded-full border-2 transition-all duration-300 ${isSelected
                  ? "border-white bg-white shadow-[0_0_10px_rgba(255,255,255,1)] scale-125"
                  : "border-gray-500 bg-gray-900 group-hover:border-white group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.7)] group-hover:scale-110"
                }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}