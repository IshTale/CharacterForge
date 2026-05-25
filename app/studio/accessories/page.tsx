"use client";

import { useState } from "react";
import JewelrySlotPanel from "@/components/studio/accessories/JewelrySlotPanel";
import { JEWELRY_SLOTS } from "@/constants/jewelry-slots";
import { jewelryHasSelection } from "@/lib/jewelry/build-pipeline";
import { useCharacterForgeStore } from "@/store/characterforge.store";
import type { JewelryConfig } from "@/types/recipe";

export default function AccessoriesPage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);

  const jewelry = recipe.jewelry;

  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const canApply = jewelryHasSelection(jewelry);

  const setAccessoryRef = (
    slotId: "ring" | "bracelet" | "watch" | "necklace",
    ref: { ref_image_url: string | null; ref_file_id?: string | null }
  ) => {
    updateRecipe((current) => {
      const nextJewelry: JewelryConfig = { ...current.jewelry };
      if (slotId === "ring") {
        nextJewelry.rings =
          ref.ref_image_url || ref.ref_file_id
            ? [
                {
                  finger: "ring",
                  ref_image_url: ref.ref_image_url ?? "",
                  ref_file_id: ref.ref_file_id ?? undefined
                }
              ]
            : [];
      } else if (slotId === "bracelet") {
        nextJewelry.bracelets =
          ref.ref_image_url || ref.ref_file_id
            ? [
                {
                  wrist: "left",
                  ref_image_url: ref.ref_image_url ?? "",
                  ref_file_id: ref.ref_file_id ?? undefined
                }
              ]
            : [];
      } else if (slotId === "watch") {
        nextJewelry.watch =
          ref.ref_image_url || ref.ref_file_id
            ? {
                wrist: "left",
                ref_image_url: ref.ref_image_url ?? "",
                ref_file_id: ref.ref_file_id ?? undefined
              }
            : null;
      } else {
        nextJewelry.necklace =
          ref.ref_image_url || ref.ref_file_id
            ? {
                ref_image_url: ref.ref_image_url ?? "",
                ref_file_id: ref.ref_file_id ?? undefined
              }
            : null;
      }
      return { ...current, jewelry: nextJewelry };
    });
    markDirty("accessories");
  };

  const jewelryRefBySlot = {
    ring: jewelry.rings[0]?.ref_image_url ?? null,
    bracelet: jewelry.bracelets[0]?.ref_image_url ?? null,
    watch: jewelry.watch?.ref_image_url ?? null,
    necklace: jewelry.necklace?.ref_image_url ?? null
  };

  const handleApplyAccessories = async () => {
    setApplyError(null);
    setApplying(true);
    try {
      await triggerRender(["accessories"]);
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : "Failed to apply accessories.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Accessories</h1>
        <p className="text-sm text-gray-400">
          Upload reference photos for rings, bracelets, watches, and necklaces, then apply them to
          the matching hand or headshot canvas.
        </p>
      </header>

      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            Accessory references
          </h2>
          <p className="text-xs text-gray-500">
            Rings, bracelets, and watches use the hand & wrist photo. Necklaces use the headshot.
          </p>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          {JEWELRY_SLOTS.map((slot) => (
            <JewelrySlotPanel
              key={slot.id}
              slotId={slot.id}
              refImageUrl={jewelryRefBySlot[slot.id]}
              onChange={(ref) => setAccessoryRef(slot.id, ref)}
              onDirty={() => markDirty("accessories")}
            />
          ))}
        </div>
      </section>

      {applyError && <p className="text-sm text-red-400">{applyError}</p>}

      <button
        type="button"
        onClick={handleApplyAccessories}
        disabled={applying || !canApply}
        className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
      >
        {applying ? "Applying accessories..." : "Apply accessories"}
      </button>
    </div>
  );
}
