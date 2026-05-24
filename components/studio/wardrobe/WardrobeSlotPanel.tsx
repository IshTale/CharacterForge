"use client";

import Image from "next/image";
import { useState } from "react";
import PhotoUploader from "@/components/shared/PhotoUploader";
import { WARDROBE_SLOT_BY_ID } from "@/constants/wardrobe-slots";
import { uploadModuleFile } from "@/lib/api/sse-task-client";
import { generateWardrobeItem } from "@/lib/wardrobe/run-wardrobe-pipeline";
import type { WardrobeItemSource, WardrobeSlotId, WardrobeSlotState } from "@/types/wardrobe";

interface WardrobeSlotPanelProps {
  slotId: WardrobeSlotId;
  value: WardrobeSlotState;
  onChange: (next: WardrobeSlotState) => void;
  onDirty: () => void;
}

export default function WardrobeSlotPanel({
  slotId,
  value,
  onChange,
  onDirty
}: WardrobeSlotPanelProps) {
  const definition = WARDROBE_SLOT_BY_ID[slotId];
  const [prompt, setPrompt] = useState(value.prompt ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMode: WardrobeItemSource = value.source ?? "generate";
  const preview = value.preview_url ?? value.ref_image_url;
  const isReady = Boolean(value.ref_file_id || value.ref_image_url);

  const setMode = (source: WardrobeItemSource) => {
    onChange({ ...value, source });
    onDirty();
  };

  const handleUpload = async (file: File | null) => {
    if (!file) {
      onChange({ source: null });
      onDirty();
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadModuleFile(file, definition.fileModule);
      onChange({
        source: "upload",
        ref_file_id: uploaded.file_id,
        ref_image_url: uploaded.public_url,
        preview_url: uploaded.public_url
      });
      onDirty();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Enter a prompt to generate this item.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const generated = await generateWardrobeItem(trimmed, slotId);
      onChange({
        source: "generate",
        prompt: trimmed,
        ref_file_id: generated.ref_file_id,
        ref_image_url: generated.ref_image_url,
        preview_url: generated.preview_url
      });
      onDirty();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const clearSlot = () => {
    setPrompt("");
    setError(null);
    onChange({ source: null });
    onDirty();
  };

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-4 shadow-lg">
      <SlotHeader title={definition.title} subtitle={definition.subtitle} ready={isReady} />

      <div className="mt-4 inline-flex rounded-lg border border-gray-700 p-1">
        {(["generate", "upload"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setMode(mode)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition ${
              activeMode === mode ? "bg-white text-black" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {activeMode === "generate" ? (
          <div className="space-y-3">
            <label className="block text-xs text-gray-400">Describe the item</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={definition.placeholder}
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-950/60 px-3 py-2 text-sm text-gray-100 outline-none ring-white/20 focus:ring-2"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
            >
              {busy ? "Generating…" : "Generate item"}
            </button>
          </div>
        ) : (
          <PhotoUploader
            label={`Upload ${definition.title.toLowerCase()} reference`}
            onChange={handleUpload}
          />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        {preview && (
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-950">
            <div className="relative aspect-square w-full">
              <Image
                src={preview}
                alt={`${definition.title} preview`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                unoptimized
              />
            </div>
            <PreviewFooter source={value.source} onClear={clearSlot} />
          </div>
        )}
      </div>
    </section>
  );
}

function SlotHeader({
  title,
  subtitle,
  ready
}: {
  title: string;
  subtitle: string;
  ready: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
          ready ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-800 text-gray-500"
        }`}
      >
        {ready ? "Ready" : "Empty"}
      </span>
    </div>
  );
}

function PreviewFooter({
  source,
  onClear
}: {
  source: WardrobeItemSource | null;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-400">
      <span className="capitalize">{source ?? "unset"} source</span>
      <button type="button" onClick={onClear} className="text-gray-300 hover:text-white">
        Clear
      </button>
    </div>
  );
}
