interface StyleGroupGridProps {
  items: Array<{ id: string; title: string; thumbnailUrl?: string }>;
}

export default function StyleGroupGrid({ items }: StyleGroupGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border border-mint-200 bg-mint-50/50 p-2">
          <div className="mb-2 aspect-square rounded-lg bg-mint-100" />
          <p className="text-xs text-plum-800">{item.title}</p>
        </article>
      ))}
    </div>
  );
}
