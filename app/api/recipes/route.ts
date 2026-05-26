import { NextResponse } from "next/server";
import { createRecipe, listRecipes } from "@/lib/recipe/repository";
import { deserialiseRecipe } from "@/lib/recipe/serializer";

export async function GET() {
  const recipes = await listRecipes();
  return NextResponse.json({ data: recipes, total: recipes.length });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  // #region agent log
  void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H3',location:'app/api/recipes/route.ts:POST:body',message:'Recipes POST received body',data:{bodyKeys:typeof body==='object'&&body!==null?Object.keys(body):[],hasCreatedAt:typeof body==='object'&&body!==null&&'created_at' in body,hasRecipeId:typeof body==='object'&&body!==null&&'recipe_id' in body},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  try {
    const recipe = deserialiseRecipe(body);
    const created = await createRecipe(recipe);
    // #region agent log
    void fetch('http://127.0.0.1:7908/ingest/6f4d8957-446a-41db-ac71-451cd352f93e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'270c40'},body:JSON.stringify({sessionId:'270c40',runId:'initial',hypothesisId:'H2,H3',location:'app/api/recipes/route.ts:POST:created',message:'Recipes POST created recipe',data:{recipeId:created.recipe_id,createdAt:created.created_at},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ recipe_id: created.recipe_id, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid recipe payload." },
      { status: 400 }
    );
  }
}
