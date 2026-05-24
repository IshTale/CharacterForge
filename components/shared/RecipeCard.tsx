interface RecipeCardProps {
  title: string;
  author: string;
}

export default function RecipeCard({ title, author }: RecipeCardProps) {
  return (
    <article className="rounded-lg border border-gray-800 p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">by {author}</p>
    </article>
  );
}
