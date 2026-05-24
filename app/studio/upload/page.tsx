"use client";

import PhotoUploader from "@/components/shared/PhotoUploader";
import { useCharacterForgeStore } from "@/store/characterforge.store";
import type { CanvasKey } from "@/types/canvas";

const moduleByCanvas: Record<CanvasKey, string> = {
  headshot: "makeup-vto",
  fullbody: "cloth",
  handwrist: "nail-vto",
  feet: "shoes"
};

async function uploadToProxy(file: File, moduleName: string) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`/api/perfectcorp/${moduleName}/file`, {
    method: "POST",
    body: form
  });
  if (!response.ok) throw new Error("Failed upload");
  return (await response.json()) as { file_id: string };
}

function UploadField({ canvas, label }: { canvas: CanvasKey; label: string }) {
  const setBasePhoto = useCharacterForgeStore((state) => state.setBasePhoto);
  const setFileId = useCharacterForgeStore((state) => state.setFileId);
  return (
    <PhotoUploader
      label={label}
      onChange={async (file) => {
        setBasePhoto(canvas, file);
        if (!file) {
          setFileId(canvas, null);
          return;
        }
        const result = await uploadToProxy(file, moduleByCanvas[canvas]);
        setFileId(canvas, result.file_id);
      }}
    />
  );
}

export default function UploadPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Upload Base Photos</h1>
      <p className="mt-2 text-gray-300">
        Add headshot, full body, hand/wrist, and feet images.
      </p>
      <div className="grid gap-3">
        <UploadField canvas="headshot" label="Headshot" />
        <UploadField canvas="fullbody" label="Full Body" />
        <UploadField canvas="handwrist" label="Hand & Wrist" />
        <UploadField canvas="feet" label="Feet" />
      </div>
    </div>
  );
}
