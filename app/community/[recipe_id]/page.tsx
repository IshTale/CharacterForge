import { redirect } from "next/navigation";

interface LegacyRecipeRouteProps {
  params: Promise<{ recipe_id: string }>;
}

export default async function LegacyCommunityRecipePage({ params }: LegacyRecipeRouteProps) {
  const { recipe_id } = await params;
  redirect(`/recipes/${recipe_id}`);
}
