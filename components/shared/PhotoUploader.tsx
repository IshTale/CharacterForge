"use client";

import { useId, useState } from "react";

interface PhotoUploaderProps {
  label: string;
  onChange?: (file: File | null) => void;
}

export default function PhotoUploader({ label, onChange }: PhotoUploaderProps) {
  const id = useId();
  const [filename, setFilename] = useState<string | null>(null);

  return (
    <label
      htmlFor={id}
      className="block cursor-pointer rounded-xl border border-dashed border-mint-300 bg-mint-100/50 p-3 transition hover:border-magenta-400 hover:bg-white/70"
    >
      <span className="text-sm font-medium text-plum-800">{label}</span>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setFilename(file?.name ?? null);
          onChange?.(file);
        }}
      />
      <p className="mt-1 text-xs text-plum-700/60">{filename ?? "PNG or JPEG"}</p>
    </label>
  );
}
