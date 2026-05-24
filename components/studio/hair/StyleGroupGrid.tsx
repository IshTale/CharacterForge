interface StyleGroupGridProps {
  items: Array<{ id: string; title: string; thumbnailUrl?: string }>;
}

export default function StyleGroupGrid({ items }: StyleGroupGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <article key={item.id} className="rounded border border-gray-700 p-2">
          <div className="mb-2 aspect-square rounded bg-gray-900" />
          <p className="text-xs text-gray-200">{item.title}</p>
        </article>
      ))}
    </div>
  );
}
