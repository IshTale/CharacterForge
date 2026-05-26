import CommunityDashboard from "@/components/community/CommunityDashboard";
import { listRecipes } from "@/lib/recipe/repository";

export default async function HomePage() {
  const recipes = await listRecipes();
  // #region agent log
  void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H1,H4,H5',location:'app/page.tsx:HomePage',message:'Home page rendered community recipes',data:{count:recipes.length,recipeIds:recipes.slice(0,5).map((recipe)=>recipe.recipe_id)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return <CommunityDashboard recipes={recipes} />;
}
