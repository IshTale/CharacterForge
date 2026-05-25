"use client";

import Image from "next/image";
import { useState } from "react";
import PhotoUploader from "@/components/shared/PhotoUploader";
import HandMapSelector from "@/components/studio/nails/HandMapSelector";
import { uploadModuleFile } from "@/lib/api/sse-task-client";
import { validatePressOnNailDesignFile } from "@/lib/validation/nail-design";
import {
  activeNailStyle,
  type NailFinger,
  type NailFingerStyle,
  type NailsConfig,
  type NailShape,
  type NailTexture
} from "@/types/nails";

const TEXTURES: NailTexture[] = ["matte", "gloss", "glitter", "chrome", "custom"];
const SHAPES: NailShape[] = ["square", "round", "oval", "stiletto", "coffin"];

interface NailStylePanelProps {
  config: NailsConfig;
  onChange: (next: NailsConfig) => void;
  onDirty: () => void;
}

export default function NailStylePanel({ config, onChange, onDirty }: NailStylePanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = activeNailStyle(config);
  const previewUrl = active.custom_texture_url ?? null;
  const coverageLabel = config.apply_to === "all" ? "all fingers" : config.apply_to;

  const patchActive = (patch: Partial<NailFingerStyle>) => {
    if (config.apply_to === "all") {
      onChange({
        ...config,
        global: { ...config.global, ...patch }
      });
    } else {
      onChange({
        ...config,
        overrides: {
          ...config.overrides,
          [config.apply_to]: {
            ...(config.overrides?.[config.apply_to] ?? config.global),
            ...patch
          }
        }
      });
    }
    onDirty();
  };

  const handleUpload = async (file: File | null) => {
    if (!file) {
      patchActive({
        custom_texture_url: null,
        custom_texture_file_id: null,
        texture: "custom"
      });
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await validatePressOnNailDesignFile(file);
      const uploaded = await uploadModuleFile(file, "nail-vto", {
        usage: "design",
        preserveOriginal: true
      });
      patchActive({
        texture: "custom",
        custom_texture_url: uploaded.public_url ?? null,
        custom_texture_file_id: uploaded.file_id
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Nail art upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const setCoverage = (finger: NailFinger) => {
    onChange({ ...config, apply_to: finger });
    onDirty();
  };

  const clearArt = () => {
    patchActive({
      custom_texture_url: null,
      custom_texture_file_id: null
    });
  };

  const ready = Boolean(previewUrl);

  return (
    <section className="space-y-4 rounded-xl border border-gray-700 bg-gray-900/40 p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Nail art</h2>
          <p className="mt-1 text-xs text-gray-400">
            Apply to all fingers or one finger, then upload a design texture (1024×1024
            recommended, max 5MB). Uses nail-vto with <code className="text-gray-300">custom</code>{" "}
            texture.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            ready ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-800 text-gray-500"
          }`}
        >
          {busy ? "Uploading…" : ready ? "Ready" : "Empty"}
        </span>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Coverage</p>
        <HandMapSelector selected={config.apply_to} onSelect={setCoverage} />
        <p className="mt-2 text-xs text-gray-500">
          Configuring: <span className="capitalize text-gray-300">{coverageLabel}</span>
        </p>
      </div>

      <div className="space-y-3 border-t border-gray-800 pt-4">
        <PhotoUploader
          label={`Upload nail design for ${coverageLabel}`}
          onChange={handleUpload}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Shape</p>
          <div className="flex flex-wrap gap-2">
            {SHAPES.map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => patchActive({ shape })}
                className={`rounded-md px-3 py-1.5 text-xs capitalize transition ${
                  (active.shape ?? "oval") === shape
                    ? "bg-white text-black"
                    : "border border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Finish (without upload)
          </p>
          <div className="flex flex-wrap gap-2">
            {TEXTURES.filter((texture) => texture !== "custom").map((texture) => (
              <button
                key={texture}
                type="button"
                onClick={() =>
                  patchActive({
                    texture,
                    custom_texture_url: null,
                    custom_texture_file_id: null
                  })
                }
                className={`rounded-md px-3 py-1.5 text-xs capitalize transition ${
                  active.texture === texture && !previewUrl
                    ? "bg-white text-black"
                    : "border border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                {texture}
              </button>
            ))}
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-950">
          <div className="relative aspect-square max-h-48 w-full">
            <Image
              src={previewUrl}
              alt="Nail design preview"
              fill
              sizes="320px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-400">
            <span className="capitalize">Custom art · {coverageLabel}</span>
            <button type="button" onClick={clearArt} disabled={busy} className="hover:text-white">
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
