"use client";

import { useCharacterForgeStore } from "@/store/characterforge.store";

export default function MakeupPage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Makeup Studio</h1>
      <label className="block text-sm text-gray-300">Color</label>
      <input
        type="color"
        value={recipe.makeup.color_hex ?? "#ff6aa2"}
        onChange={(event) => {
          updateRecipe((current) => ({
            ...current,
            makeup: { ...current.makeup, color_hex: event.target.value }
          }));
          markDirty("makeup");
        }}
      />
      <label className="block text-sm text-gray-300">Intensity</label>
      <input
        type="range"
        min={0}
        max={100}
        value={recipe.makeup.intensity ?? 50}
        onChange={(event) => {
          updateRecipe((current) => ({
            ...current,
            makeup: { ...current.makeup, intensity: Number(event.target.value) }
          }));
          markDirty("makeup");
        }}
      />
      <button
        type="button"
        onClick={() => triggerRender(["makeup"])}
        className="rounded bg-white px-4 py-2 text-black"
      >
        Apply Makeup
      </button>
    </div>
  );
}
