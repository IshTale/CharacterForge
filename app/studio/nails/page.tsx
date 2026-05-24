"use client";

import { useState } from "react";
import JewelrySlotPanel from "@/components/studio/nails/JewelrySlotPanel";
import NailStylePanel from "@/components/studio/nails/NailStylePanel";
import { JEWELRY_SLOTS } from "@/constants/jewelry-slots";
import { useCharacterForgeStore } from "@/store/characterforge.store";
import { activeNailStyle, createDefaultNailsConfig } from "@/types/nails";
import type { JewelryConfig, NailsConfig } from "@/types/recipe";

function ensureNailsConfig(nails: NailsConfig | undefined): NailsConfig {
  if (nails?.global) {
    return nails;
  }
  const legacy = nails as NailsConfig & {
    color_hex?: string;
    intensity?: number;
    texture?: string;
    custom_texture_url?: string;
  };
  if (legacy?.color_hex || legacy?.texture || legacy?.custom_texture_url) {
    return {
      apply_to: legacy.apply_to ?? "all",
      global: {
        color_hex: legacy.color_hex,
        intensity: legacy.intensity,
        texture: (legacy.texture as NailsConfig["global"]["texture"]) ?? "custom",
        custom_texture_url: legacy.custom_texture_url,
        shape: "oval"
      },
      overrides: legacy.overrides ?? {}
    };
  }
  return createDefaultNailsConfig();
}

export default function NailsPage() {
  const recipe = useCharacterForgeStore((state) => state.recipe);
  const updateRecipe = useCharacterForgeStore((state) => state.updateRecipe);
  const markDirty = useCharacterForgeStore((state) => state.markDirty);
  const triggerRender = useCharacterForgeStore((state) => state.triggerRender);
  const publishRecipe = useCharacterForgeStore((state) => state.publishRecipe);

  const nails = ensureNailsConfig(recipe.nails);
  const jewelry = recipe.jewelry;

  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const nailReady = Boolean(activeNailStyle(nails).custom_texture_url);

  const setJewelryRef = (
    slotId: "ring" | "bracelet" | "watch" | "necklace",
    ref: { ref_image_url: string | null; ref_file_id?: string | null }
  ) => {
    updateRecipe((current) => {
      const nextJewelry: JewelryConfig = { ...current.jewelry };
      if (slotId === "ring") {
        nextJewelry.rings = ref.ref_image_url || ref.ref_file_id
          ? [{ finger: "ring", ref_image_url: ref.ref_image_url ?? "", ref_file_id: ref.ref_file_id ?? undefined }]
          : [];
      } else if (slotId === "bracelet") {
        nextJewelry.bracelets = ref.ref_image_url || ref.ref_file_id
          ? [{ wrist: "left", ref_image_url: ref.ref_image_url ?? "", ref_file_id: ref.ref_file_id ?? undefined }]
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
    markDirty("nails");
  };

  const jewelryRefBySlot = {
    ring: jewelry.rings[0]?.ref_image_url ?? null,
    bracelet: jewelry.bracelets[0]?.ref_image_url ?? null,
    watch: jewelry.watch?.ref_image_url ?? null,
    necklace: jewelry.necklace?.ref_image_url ?? null
  };

  const handleApplyNails = async () => {
    setApplyError(null);
    setApplying(true);
    try {
      await triggerRender(["nails"]);
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : "Failed to apply nails.");
    } finally {
      setApplying(false);
    }
  };

  const handlePublish = async () => {
    setPublishError(null);
    setPublishing(true);
    try {
      const recipeId = await publishRecipe();
      alert(`Published recipe ${recipeId}`);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Failed to publish recipe.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Nails</h1>
        <p className="text-sm text-gray-400">
          Choose all fingers or one finger, upload nail art, then apply. Optional jewelry below is
          included in the same apply when configured.
        </p>
      </header>

      <NailStylePanel
        config={nails}
        onChange={(next) => {
          updateRecipe((current) => ({ ...current, nails: next }));
        }}
        onDirty={() => markDirty("nails")}
      />

      {applyError && <p className="text-sm text-red-400">{applyError}</p>}

      <button
        type="button"
        onClick={handleApplyNails}
        disabled={applying || !nailReady}
        className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
      >
        {applying ? "Applying nails…" : "Apply nails"}
      </button>

      <section className="space-y-4 border-t border-gray-800 pt-8">
        <header className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            Jewelry (optional)
          </h2>
          <p className="text-xs text-gray-500">
            Ring, bracelet, watch, and necklace reference uploads — separate from nail VTO.
          </p>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          {JEWELRY_SLOTS.map((slot) => (
            <JewelrySlotPanel
              key={slot.id}
              slotId={slot.id}
              refImageUrl={jewelryRefBySlot[slot.id]}
              onChange={(ref) => setJewelryRef(slot.id, ref)}
              onDirty={() => markDirty("nails")}
            />
          ))}
        </div>
      </section>

      {publishError && <p className="text-sm text-red-400">{publishError}</p>}

      <button
        type="button"
        onClick={handlePublish}
        disabled={publishing}
        className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:border-gray-500 disabled:opacity-60"
      >
        {publishing ? "Publishing…" : "Publish recipe"}
      </button>
    </div>
  );
}
