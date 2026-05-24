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
        setCanvasImage(canvas, result.public_url);
      }
    } catch (uploadError) {
      setBasePhoto(canvas, null);
      setFileId(canvas, null);
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed. Check image requirements."
      );
    } finally {
      setBusy(false);
    }
  };

  const ready = Boolean(fileId);

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{requirements.label}</h2>
          <p className="mt-1 text-xs text-gray-400">{requirements.poseHint}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            ready ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-800 text-gray-500"
          }`}
        >
          {busy ? "Uploading…" : ready ? "Ready" : "Empty"}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-gray-500">
        <li>
          Formats: {requirements.formats} · Max {requirements.maxFileSizeMb}MB · Long side ≤{" "}
          {requirements.maxLongSidePx}px
        </li>
      </ul>

      <label
        htmlFor={inputId}
        className={`mt-4 block cursor-pointer rounded-lg border border-dashed border-gray-600 p-4 transition hover:border-gray-500 ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <span className="text-sm text-gray-300">
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
          <p className="mt-1 truncate text-xs text-gray-500">{basePhoto.name}</p>
        )}
      </label>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-700 bg-gray-950">
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
          <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-400">
            <span>{ready ? "Uploaded to studio" : "Preview only"}</span>
            <button
              type="button"
              onClick={clearUpload}
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
