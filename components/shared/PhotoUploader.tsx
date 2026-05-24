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
    <label htmlFor={id} className="block cursor-pointer rounded border border-dashed border-gray-700 p-3">
      <span className="text-sm text-gray-300">{label}</span>
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
      <p className="mt-1 text-xs text-gray-500">{filename ?? "PNG or JPEG"}</p>
    </label>
  );
}
