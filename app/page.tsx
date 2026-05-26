import CommunityDashboard from "@/components/community/CommunityDashboard";
import { listRecipes } from "@/lib/recipe/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recipes = await listRecipes();
  return <CommunityDashboard recipes={recipes} />;
}
