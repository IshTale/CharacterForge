interface GarmentCardProps {
  title: string;
  imageUrl?: string;
}

export default function GarmentCard({ title, imageUrl }: GarmentCardProps) {
  return (
    <article className="rounded-xl border border-mint-200 bg-mint-50/50 p-3">
      <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-mint-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-plum-700/60">No Preview</div>
        )}
      </div>
      <p className="text-sm font-medium text-plum-800">{title}</p>
    </article>
  );
}
