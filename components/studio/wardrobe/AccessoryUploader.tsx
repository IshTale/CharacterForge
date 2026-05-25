"use client";

import PhotoUploader from "@/components/shared/PhotoUploader";

interface AccessoryUploaderProps {
  accessory: "hat" | "bag";
}

export default function AccessoryUploader({ accessory }: AccessoryUploaderProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium uppercase text-gray-300">{accessory}</h3>
      <PhotoUploader label={`Upload ${accessory} reference`} />
    </div>
  );
}
