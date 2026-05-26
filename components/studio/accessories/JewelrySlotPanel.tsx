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
  onChange: (ref: { ref_image_url: string | null; ref_file_id?: string | null }) => void;
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
      onChange({ ref_image_url: null, ref_file_id: null });
      onDirty();
      return;
    }

    setBusy(true);
    setError(null);
    try {
      ImageValidator.validateAccessory(file);
      const uploaded = await uploadModuleFile(file, definition.fileModule, {
        usage: "reference"
      });
      onChange({
        ref_image_url: uploaded.public_url ?? null,
        ref_file_id: uploaded.file_id
      });
      onDirty();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const clearSlot = () => {
    setError(null);
    onChange({ ref_image_url: null, ref_file_id: null });
    onDirty();
  };

  return (
    <section className="beauty-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-plum-900">{definition.title}</h2>
          <p className="mt-1 text-xs text-plum-700/70">{definition.subtitle}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            isReady ? "bg-mint-200 text-mint-500" : "bg-mint-100 text-plum-700/60"
          }`}
        >
          {busy ? "Uploading..." : isReady ? "Ready" : "Empty"}
        </span>
      </div>

      <p className="mt-3 text-xs text-plum-700/60">JPG or PNG, max 5MB, 1024x1024 recommended</p>

      <div className="mt-4">
        <PhotoUploader
          label={`Upload ${definition.title.toLowerCase()} reference`}
          onChange={handleUpload}
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {refImageUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-mint-200 bg-white/70 shadow-lg shadow-mint-500/10">
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
          <div className="flex items-center justify-between px-3 py-2 text-xs text-plum-700/70">
            <span>upload source</span>
            <button
              type="button"
              onClick={clearSlot}
              disabled={busy}
              className="font-medium text-magenta-600 hover:text-magenta-500 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
