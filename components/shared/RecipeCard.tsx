interface RecipeCardProps {
  title: string;
  author: string;
  displayImageUrl?: string;
}

export default function RecipeCard({ title, author, displayImageUrl }: RecipeCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-mint-300/70 bg-white/70 shadow-[0_18px_45px_rgba(31,111,123,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-mint-500 hover:shadow-[0_24px_60px_rgba(31,111,123,0.22)]">
      <div className="bg-mint-100">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={`${title} display picture`}
            className="block h-auto w-full transition duration-500 group-hover:scale-[1.01]"
            loading="lazy"
          />
        ) : (
          <RecipePlaceholder />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-plum-900">{title}</h3>
            <p className="mt-1 text-sm font-medium text-plum-800/75">by {author}</p>
          </div>
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-magenta-400/25 bg-blush-100 text-magenta-500 shadow-sm"
          >
            <HeartIcon />
          </span>
        </div>
      </div>
    </article>
  );
}

function RecipePlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_30%_20%,rgba(255,191,211,0.42),transparent_34%),linear-gradient(135deg,#fff3f8_0%,#e8fbfb_100%)] px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-white/80 bg-white/60 shadow-[0_12px_30px_rgba(31,111,123,0.14)]">
        <SparkleIcon />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum-800/80">
          Ready for a glow shot
        </p>
        <p className="mt-1 text-xs text-plum-800/70">Add a cover to showcase the look.</p>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8 text-magenta-500"
      viewBox="0 0 32 32"
      fill="none"
    >
      <path
        d="M16 3.5l2.4 7.1 7.1 2.4-7.1 2.4-2.4 7.1-2.4-7.1-7.1-2.4 7.1-2.4L16 3.5z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M24.5 20.5l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"
        fill="#3fb7c7"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 17.1l-1.1-1C4.8 12.4 2 9.8 2 6.6 2 4 4 2 6.5 2c1.4 0 2.8.7 3.5 1.8C10.7 2.7 12.1 2 13.5 2 16 2 18 4 18 6.6c0 3.2-2.8 5.8-6.9 9.5l-1.1 1z" />
    </svg>
  );
}
