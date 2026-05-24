"use client";

const TEXTURES = ["matte", "satin", "shimmer", "gloss", "metallic", "holographic", "sheer"];

interface TextureSelectorProps {
  selected?: string;
  onSelect: (texture: string) => void;
}

export default function TextureSelector({ selected, onSelect }: TextureSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEXTURES.map((texture) => (
        <button
          key={texture}
          type="button"
          onClick={() => onSelect(texture)}
          className={`rounded border px-2 py-1 text-xs ${
            selected === texture ? "border-white" : "border-gray-700"
          }`}
        >
          {texture}
        </button>
      ))}
    </div>
  );
}
