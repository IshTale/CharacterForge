"use client";

import CanvasUploadField from "@/components/studio/upload/CanvasUploadField";
import type { CanvasKey } from "@/types/canvas";

const UPLOAD_ORDER: CanvasKey[] = ["headshot", "fullbody", "handwrist"];

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Upload Base Photos</h1>
        <p className="text-sm text-gray-400">
          Each canvas is validated against Perfect Corp requirements before upload. These photos
          are required before continuing to styling modules.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {UPLOAD_ORDER.map((canvas) => (
          <CanvasUploadField key={canvas} canvas={canvas} />
        ))}
      </div>
    </div>
  );
}
