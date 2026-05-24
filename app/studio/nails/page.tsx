"use client";

import HandMapSelector from "@/components/studio/nails/HandMapSelector";
import JewelryPanel from "@/components/studio/nails/JewelryPanel";
import NailConfigPanel from "@/components/studio/nails/NailConfigPanel";
import { useCharacterForgeStore } from "@/store/characterforge.store";

export default function NailsPage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);
  const publishRecipe = useCharacterForgeStore((state) => state.publishRecipe);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nails & Jewelry</h1>
      <HandMapSelector
        selected={recipe.nails.apply_to}
        onSelect={(finger) => {
          updateRecipe((current) => ({
            ...current,
            nails: { ...current.nails, apply_to: finger }
          }));
          markDirty("nails");
        }}
      />
      <NailConfigPanel
        color={recipe.nails.color_hex ?? "#ff4fa3"}
        intensity={recipe.nails.intensity ?? 60}
        texture={recipe.nails.texture ?? "gloss"}
        onColorChange={(color) => {
          updateRecipe((current) => ({
            ...current,
            nails: { ...current.nails, color_hex: color }
          }));
          markDirty("nails");
        }}
        onIntensityChange={(value) => {
          updateRecipe((current) => ({
            ...current,
            nails: { ...current.nails, intensity: value }
          }));
          markDirty("nails");
        }}
        onTextureChange={(texture) => {
          updateRecipe((current) => ({
            ...current,
            nails: { ...current.nails, texture }
          }));
          markDirty("nails");
        }}
      />
      <JewelryPanel />
      <button
        type="button"
        onClick={() => triggerRender(["nails"])}
        className="rounded bg-white px-4 py-2 text-black"
      >
        Apply Nails & Jewelry
      </button>
      <button
        type="button"
        onClick={async () => {
          const recipeId = await publishRecipe();
          alert(`Published recipe ${recipeId}`);
        }}
        className="rounded border border-gray-500 px-4 py-2"
      >
        Publish Recipe
      </button>
    </div>
  );
}
