"use client";

import { useState } from "react";
import PromptInput from "@/components/studio/wardrobe/PromptInput";
import GarmentCard from "@/components/studio/wardrobe/GarmentCard";
import { useCharacterForgeStore } from "@/store/characterforge.store";

export default function WardrobePage() {
  const [prompt, setPrompt] = useState("Cyberpunk leather jacket");
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);

  const addItem = () => {
    updateRecipe((current) => ({
      ...current,
      wardrobe: {
        ...current.wardrobe,
        items: [
          ...current.wardrobe.items,
          {
            item_id: crypto.randomUUID(),
            type: "upper_body",
            prompt
          }
        ]
      }
    }));
    markDirty("wardrobe");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Wardrobe & Accessories</h1>
      <PromptInput />
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="w-full rounded border border-gray-700 bg-transparent px-3 py-2"
        />
        <button type="button" onClick={addItem} className="rounded bg-white px-3 py-2 text-black">
          Add
        </button>
        <button
          type="button"
          onClick={() => triggerRender(["wardrobe"])}
          className="rounded border border-gray-500 px-3 py-2"
        >
          Apply
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {recipe.wardrobe.items.map((item) => (
          <GarmentCard key={item.item_id} title={item.prompt} imageUrl={item.generated_image_url} />
        ))}
      </div>
    </div>
  );
}
