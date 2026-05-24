import PhotoUploader from "@/components/shared/PhotoUploader";

export default function JewelryPanel() {
  return (
    <section className="space-y-3 rounded border border-gray-700 p-3">
      <h3 className="text-sm font-medium text-gray-200">Jewelry</h3>
      <PhotoUploader label="Ring reference" />
      <PhotoUploader label="Bracelet reference" />
      <PhotoUploader label="Watch reference" />
      <PhotoUploader label="Necklace reference" />
    </section>
  );
}
