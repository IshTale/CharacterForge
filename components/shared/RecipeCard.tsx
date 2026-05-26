import Image from "next/image";

interface RecipeCardProps {
  title: string;
  author: string;
  displayImageUrl?: string;
}

export default function RecipeCard({ title, author, displayImageUrl }: RecipeCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-gray-800 bg-gray-950/50 transition hover:border-gray-700">
      <div className="relative aspect-[4/3] bg-gray-900">
        {displayImageUrl ? (
          <Image
            src={displayImageUrl}
            alt={`${title} display picture`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-gray-600">
            No display picture
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">by {author}</p>
      </div>
    </article>
  );
}
