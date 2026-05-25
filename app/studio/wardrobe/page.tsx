"use client";

import { useState } from "react";
import WardrobeSlotPanel from "@/components/studio/wardrobe/WardrobeSlotPanel";
import { CLOTHING_SLOTS, WARDROBE_SLOTS } from "@/constants/wardrobe-slots";
import { useCharacterForgeStore } from "@/store/characterforge.store";
import type { WardrobeConfig, WardrobeSlotId, WardrobeSlotState } from "@/types/wardrobe";
import { createEmptyWardrobeSlot } from "@/types/wardrobe";

function ensureWardrobeConfig(wardrobe: WardrobeConfig | undefined): WardrobeConfig {
  if (wardrobe?.top && wardrobe.bottom && wardrobe.hat) {
    return wardrobe;
  }
  return {
    gender: wardrobe?.gender ?? "female",
    top: wardrobe?.top ?? createEmptyWardrobeSlot(),
    bottom: wardrobe?.bottom ?? createEmptyWardrobeSlot(),
    hat: wardrobe?.hat ?? createEmptyWardrobeSlot(),
    bag: wardrobe?.bag ?? createEmptyWardrobeSlot()
  };
}

export default function WardrobePage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);

  const wardrobe = ensureWardrobeConfig(recipe.wardrobe as WardrobeConfig);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const updateSlot = (slotId: WardrobeSlotId, next: WardrobeSlotState) => {
    updateRecipe((current) => ({
      ...current,
      wardrobe: {
        ...ensureWardrobeConfig(current.wardrobe as WardrobeConfig),
        [slotId]: next
      }
    }));
  };

  const setGender = (gender: "female" | "male") => {
    updateRecipe((current) => ({
      ...current,
      wardrobe: {
        ...ensureWardrobeConfig(current.wardrobe as WardrobeConfig),
        gender
      }
    }));
    markDirty("wardrobe");
  };

  const handleApply = async () => {
    setApplyError(null);
    setApplying(true);
    try {
      await triggerRender(["wardrobe"]);
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : "Failed to apply wardrobe.");
    } finally {
      setApplying(false);
    }
  };

  const clothingSlots = WARDROBE_SLOTS.filter((slot) => CLOTHING_SLOTS.includes(slot.id));
  const accessorySlots = WARDROBE_SLOTS.filter((slot) => !CLOTHING_SLOTS.includes(slot.id));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Wardrobe & Accessories</h1>
        <p className="text-sm text-gray-400">
          Configure each piece with AI generation or your own product photo, then apply the full
          try-on pipeline.
        </p>
      </header>

      <section className="rounded-xl border border-gray-700 bg-gray-900/30 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Model fit</p>
        <div className="inline-flex rounded-lg border border-gray-700 p-1">
          {(["female", "male"] as const).map((gender) => (
            <button
              key={gender}
              type="button"
              onClick={() => setGender(gender)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition ${
                wardrobe.gender === gender
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Clothing</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {clothingSlots.map((slot) => (
            <WardrobeSlotPanel
              key={slot.id}
              slotId={slot.id}
              value={wardrobe[slot.id]}
              onChange={(next) => updateSlot(slot.id, next)}
              onDirty={() => markDirty("wardrobe")}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Accessories</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {accessorySlots.map((slot) => (
            <WardrobeSlotPanel
              key={slot.id}
              slotId={slot.id}
              value={wardrobe[slot.id]}
              onChange={(next) => updateSlot(slot.id, next)}
              onDirty={() => markDirty("wardrobe")}
            />
          ))}
        </div>
      </section>

      {applyError && <p className="text-sm text-red-400">{applyError}</p>}

      <button
        type="button"
        onClick={handleApply}
        disabled={applying}
        className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
      >
        {applying ? "Applying wardrobe…" : "Apply full wardrobe"}
      </button>
    </div>
  );
}
