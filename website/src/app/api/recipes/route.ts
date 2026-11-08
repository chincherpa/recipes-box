import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

interface Ingredient {
  zutat: string;
  menge: string;
  taetigkeit: string;
}

interface Recipe {
  name: string;
  category: string;
  ingredients: Ingredient[];
  bemerkung?: string;
}

interface RecipeRow {
  name: string;
  category: string;
  bemerkung: string;
  ingredients: (Ingredient & { sort_order: number })[];
}

function dbError(e: unknown) {
  console.error(e);
  return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
}

async function nameExists(name: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("recipes")
    .select("id")
    .eq("name", name)
    .limit(1);
  if (error) throw error;
  return !!data && data.length > 0;
}

// GET - Alle Rezepte lesen
export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("recipes")
      .select("name, category, bemerkung, ingredients(zutat, menge, taetigkeit, sort_order)")
      .order("name");
    if (error) throw error;

    const recipes: Recipe[] = (data as RecipeRow[]).map((r) => ({
      name: r.name,
      category: r.category,
      bemerkung: r.bemerkung,
      ingredients: [...r.ingredients]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => ({ zutat: i.zutat, menge: i.menge, taetigkeit: i.taetigkeit })),
    }));
    return NextResponse.json(recipes);
  } catch (e) {
    return dbError(e);
  }
}

// POST - Neues Rezept hinzufügen
export async function POST(request: Request) {
  try {
    const newRecipe: Recipe = await request.json();

    if (await nameExists(newRecipe.name)) {
      return NextResponse.json({ error: "Rezept existiert bereits" }, { status: 400 });
    }

    const { error } = await getSupabase().rpc("save_recipe", {
      p_original_name: null,
      p_name: newRecipe.name,
      p_category: newRecipe.category,
      p_bemerkung: newRecipe.bemerkung ?? "",
      p_ingredients: newRecipe.ingredients,
    });
    if (error) throw error;

    return NextResponse.json(newRecipe, { status: 201 });
  } catch (e) {
    return dbError(e);
  }
}

// PUT - Rezept aktualisieren
export async function PUT(request: Request) {
  try {
    const { originalName, recipe }: { originalName: string; recipe: Recipe } = await request.json();

    if (!(await nameExists(originalName))) {
      return NextResponse.json({ error: "Rezept nicht gefunden" }, { status: 404 });
    }

    if (originalName !== recipe.name && (await nameExists(recipe.name))) {
      return NextResponse.json(
        { error: "Ein Rezept mit diesem Namen existiert bereits" },
        { status: 400 }
      );
    }

    const { error } = await getSupabase().rpc("save_recipe", {
      p_original_name: originalName,
      p_name: recipe.name,
      p_category: recipe.category,
      p_bemerkung: recipe.bemerkung ?? "",
      p_ingredients: recipe.ingredients,
    });
    if (error) throw error;

    return NextResponse.json(recipe);
  } catch (e) {
    return dbError(e);
  }
}

// DELETE - Rezept löschen (Zutaten per ON DELETE CASCADE)
export async function DELETE(request: Request) {
  try {
    const { name }: { name: string } = await request.json();

    const { data, error } = await getSupabase()
      .from("recipes")
      .delete()
      .eq("name", name)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Rezept nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return dbError(e);
  }
}

// PATCH - Kategorie für mehrere Rezepte aktualisieren (wenn Kategorie umbenannt wird)
export async function PATCH(request: Request) {
  try {
    const { oldCategory, newCategory }: { oldCategory: string; newCategory: string } =
      await request.json();

    const { data, error } = await getSupabase()
      .from("recipes")
      .update({ category: newCategory })
      .eq("category", oldCategory)
      .select("id");
    if (error) throw error;

    return NextResponse.json({ success: true, updated: data?.length ?? 0 });
  } catch (e) {
    return dbError(e);
  }
}
