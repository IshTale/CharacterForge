"use client";

import Image from "next/image";
import { useState } from "react";
import PhotoUploader from "@/components/shared/PhotoUploader";
import { JEWELRY_SLOT_BY_ID, type JewelrySlotId } from "@/constants/jewelry-slots";
import { uploadModuleFile } from "@/lib/api/sse-task-client";
import { ImageValidator } from "@/lib/validation/upload";

interface JewelrySlotPanelProps {
  slotId: JewelrySlotId;
  refImageUrl: string | null | undefined;
  onChange: (refImageUrl: string | null) => void;
  onDirty: () => void;
}

export default function JewelrySlotPanel({
  slotId,
  refImageUrl,
  onChange,
  onDirty
}: JewelrySlotPanelProps) {
  const definition = JEWELRY_SLOT_BY_ID[slotId];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isReady = Boolean(refImageUrl);

  const handleUpload = async (file: File | null) => {
    if (!file) {
      onChange(null);
      onDirty();
      return;
    }

    setBusy(true);
    setError(null);
    try {
      ImageValidator.validateAccessory(file);
      const uploaded = await uploadModuleFile(file, definition.fileModule);
      onChange(uploaded.public_url ?? null);
      onDirty();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const clearSlot = () => {
    setError(null);
    onChange(null);
    onDirty();
  };

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{definition.title}</h2>
          <p className="mt-1 text-xs text-gray-400">{definition.subtitle}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            isReady ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-800 text-gray-500"
          }`}
        >
          {busy ? "Uploading…" : isReady ? "Ready" : "Empty"}
        </span>
      </div>

      <p className="mt-3 text-xs text-gray-500">JPG or PNG · Max 5MB · 1024×1024 recommended</p>

      <div className="mt-4">
        <PhotoUploader
          label={`Upload ${definition.title.toLowerCase()} reference`}
          onChange={handleUpload}
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {refImageUrl && (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-700 bg-gray-950">
          <div className="relative aspect-square w-full">
            <Image
              src={refImageUrl}
              alt={`${definition.title} preview`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-400">
            <span>upload source</span>
            <button
              type="button"
              onClick={clearSlot}
              disabled={busy}
              className="text-gray-300 hover:text-white disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
