"use client";

import HairPipelinePreview from "@/components/studio/hair/HairPipelinePreview";
import { useCharacterForgeStore } from "@/store/characterforge.store";

export default function HairPage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);

  const activeStages = Object.entries(recipe.hair)
    .filter(([, value]) => value)
    .map(([key]) => key);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Hair Styling</h1>
      <HairPipelinePreview activeStages={activeStages} />
      <button
        type="button"
        className="rounded border border-gray-500 px-3 py-2"
        onClick={() => {
          updateRecipe((current) => ({
            ...current,
            hair: {
              ...current.hair,
              style: {
                style_group_id: "default",
                style_id: "style-1",
                title: "Soft Wave"
              }
            }
          }));
          markDirty("hair");
        }}
      >
        Pick Sample Style
      </button>
      <button
        type="button"
        onClick={() => triggerRender(["hair"])}
        className="rounded bg-white px-4 py-2 text-black"
      >
        Apply Hair
      </button>
    </div>
  );
}
