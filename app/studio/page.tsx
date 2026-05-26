import { redirect } from "next/navigation";

interface StudioPageProps {
  searchParams: Promise<{ recipe_id?: string }>;
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const { recipe_id } = await searchParams;
  redirect(recipe_id ? `/studio/upload?recipe_id=${encodeURIComponent(recipe_id)}` : "/studio/upload");
}
