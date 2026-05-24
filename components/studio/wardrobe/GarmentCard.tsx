interface GarmentCardProps {
  title: string;
  imageUrl?: string;
}

export default function GarmentCard({ title, imageUrl }: GarmentCardProps) {
  return (
    <article className="rounded border border-gray-700 p-3">
      <div className="mb-2 aspect-square overflow-hidden rounded bg-gray-900">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-gray-500">No Preview</div>
        )}
      </div>
      <p className="text-sm text-gray-200">{title}</p>
    </article>
  );
}
