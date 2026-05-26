"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { CANVAS_UPLOAD_REQUIREMENTS } from "@/constants/upload-requirements";
import { uploadModuleFile } from "@/lib/api/sse-task-client";
import { ImageValidator } from "@/lib/validation/upload";
import { useCharacterForgeStore } from "@/store/characterforge.store";
import type { CanvasKey } from "@/types/canvas";

const moduleByCanvas: Record<CanvasKey, string> = {
  headshot: "makeup-vto",
  fullbody: "cloth",
  handwrist: "nail-vto",
  feet: "shoes"
};

interface CanvasUploadFieldProps {
  canvas: CanvasKey;
}

export default function CanvasUploadField({ canvas }: CanvasUploadFieldProps) {
  const requirements = CANVAS_UPLOAD_REQUIREMENTS[canvas];
  const inputId = useId();
  const setBasePhoto = useCharacterForgeStore((state) => state.setBasePhoto);
  const setFileId = useCharacterForgeStore((state) => state.setFileId);
  const setCanvasImage = useCharacterForgeStore((state) => state.setCanvasImage);
  const saveSectionSnapshot = useCharacterForgeStore((state) => state.saveSectionSnapshot);
  const clearSnapshotsAfter = useCharacterForgeStore((state) => state.clearSnapshotsAfter);
  const fileId = useCharacterForgeStore((state) => state.fileIds[canvas]);
  const basePhoto = useCharacterForgeStore((state) => state.basePhotos[canvas]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!basePhoto) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(basePhoto);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [basePhoto]);

  const clearUpload = () => {
    setError(null);
    setBasePhoto(canvas, null);
    setFileId(canvas, null);
    setCanvasImage(canvas, null, null);
    saveSectionSnapshot("upload");
    clearSnapshotsAfter("upload");
  };

  const handleFile = async (file: File | null) => {
    if (!file) {
      clearUpload();
      return;
    }

    setBusy(true);
    setError(null);
    setBasePhoto(canvas, file);

    try {
      await ImageValidator.validateCanvasFile(canvas, file);
      const result = await uploadModuleFile(file, moduleByCanvas[canvas]);
      setFileId(canvas, result.file_id);
      if (result.public_url) {
        setCanvasImage(canvas, result.public_url, result.file_id);
      }
      saveSectionSnapshot("upload");
      clearSnapshotsAfter("upload");
    } catch (uploadError) {
      setBasePhoto(canvas, null);
      setFileId(canvas, null);
      setCanvasImage(canvas, null, null);
      saveSectionSnapshot("upload");
      clearSnapshotsAfter("upload");
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed. Check image requirements."
      );
    } finally {
      setBusy(false);
    }
  };

  const ready = Boolean(fileId);

  return (
    <section className="beauty-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-plum-900">{requirements.label}</h2>
          <p className="mt-1 text-xs text-plum-700/70">{requirements.poseHint}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            ready ? "bg-mint-200 text-mint-500" : "bg-mint-100 text-plum-700/60"
          }`}
        >
          {busy ? "Uploading…" : ready ? "Ready" : "Empty"}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-plum-700/60">
        <li>
          Formats: {requirements.formats} · Max {requirements.maxFileSizeMb}MB · Long side ≤{" "}
          {requirements.maxLongSidePx}px
        </li>
        <li>Larger files are compressed automatically before upload.</li>
      </ul>

      <label
        htmlFor={inputId}
        className={`mt-4 block cursor-pointer rounded-xl border border-dashed border-mint-300 bg-mint-100/50 p-4 transition hover:border-magenta-400 hover:bg-white/70 ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <span className="text-sm font-medium text-plum-800">
          {busy ? "Validating and uploading…" : `Choose ${requirements.label.toLowerCase()} photo`}
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            void handleFile(file);
            event.target.value = "";
          }}
        />
        {basePhoto && (
          <p className="mt-1 truncate text-xs text-plum-700/60">{basePhoto.name}</p>
        )}
      </label>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-mint-200 bg-white/70 shadow-lg shadow-mint-500/10">
          <div className="relative aspect-[4/5] w-full max-h-64">
            <Image
              src={previewUrl}
              alt={`${requirements.label} preview`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-xs text-plum-700/70">
            <span>{ready ? "Uploaded to studio" : "Preview only"}</span>
            <button
              type="button"
              onClick={clearUpload}
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
