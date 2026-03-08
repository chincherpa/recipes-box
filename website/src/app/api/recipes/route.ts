import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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
  id: number;
  name: string;
  category: string;
  bemerkung: string;
}

interface IngredientRow {
  zutat: string;
  menge: string;
  taetigkeit: string;
  sort_order: number;
}

function getAllRecipes(): Recipe[] {
  const db = getDb();
  const recipes = db.prepare("SELECT id, name, category, bemerkung FROM recipes ORDER BY name").all() as RecipeRow[];
  const result: Recipe[] = [];

  for (const r of recipes) {
    const ingredients = db
      .prepare(
        "SELECT zutat, menge, taetigkeit FROM ingredients WHERE recipe_id = ? ORDER BY sort_order"
      )
      .all(r.id) as IngredientRow[];

    result.push({
      name: r.name,
      category: r.category,
      bemerkung: r.bemerkung,
      ingredients: ingredients.map((i) => ({
        zutat: i.zutat,
        menge: i.menge,
        taetigkeit: i.taetigkeit,
      })),
    });
  }

  return result;
}

// GET - Alle Rezepte lesen
export async function GET() {
  try {
    const recipes = getAllRecipes();
    return NextResponse.json(recipes);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// POST - Neues Rezept hinzufügen
export async function POST(request: Request) {
  try {
    const newRecipe: Recipe = await request.json();
    const db = getDb();

    const existing = db.prepare("SELECT id FROM recipes WHERE name = ?").get(newRecipe.name);
    if (existing) {
      return NextResponse.json({ error: "Rezept existiert bereits" }, { status: 400 });
    }

    const tx = db.transaction(() => {
      const info = db
        .prepare("INSERT INTO recipes (name, category, bemerkung) VALUES (?, ?, ?)")
        .run(newRecipe.name, newRecipe.category, newRecipe.bemerkung ?? "");

      const recipeId = info.lastInsertRowid;
      const insertIng = db.prepare(
        "INSERT INTO ingredients (recipe_id, zutat, menge, taetigkeit, sort_order) VALUES (?, ?, ?, ?, ?)"
      );
      newRecipe.ingredients.forEach((ing, i) => {
        insertIng.run(recipeId, ing.zutat, ing.menge, ing.taetigkeit, i);
      });
    });

    tx();
    return NextResponse.json(newRecipe, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// PUT - Rezept aktualisieren
export async function PUT(request: Request) {
  try {
    const { originalName, recipe }: { originalName: string; recipe: Recipe } = await request.json();
    const db = getDb();

    const existing = db.prepare("SELECT id FROM recipes WHERE name = ?").get(originalName) as { id: number } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Rezept nicht gefunden" }, { status: 404 });
    }

    if (originalName !== recipe.name) {
      const duplicate = db.prepare("SELECT id FROM recipes WHERE name = ?").get(recipe.name);
      if (duplicate) {
        return NextResponse.json(
          { error: "Ein Rezept mit diesem Namen existiert bereits" },
          { status: 400 }
        );
      }
    }

    const tx = db.transaction(() => {
      db.prepare("UPDATE recipes SET name = ?, category = ?, bemerkung = ? WHERE id = ?").run(
        recipe.name,
        recipe.category,
        recipe.bemerkung ?? "",
        existing.id
      );

      // Alte Zutaten löschen (ON DELETE CASCADE würde nicht helfen, da wir nur updaten)
      db.prepare("DELETE FROM ingredients WHERE recipe_id = ?").run(existing.id);

      const insertIng = db.prepare(
        "INSERT INTO ingredients (recipe_id, zutat, menge, taetigkeit, sort_order) VALUES (?, ?, ?, ?, ?)"
      );
      recipe.ingredients.forEach((ing, i) => {
        insertIng.run(existing.id, ing.zutat, ing.menge, ing.taetigkeit, i);
      });
    });

    tx();
    return NextResponse.json(recipe);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// DELETE - Rezept löschen
export async function DELETE(request: Request) {
  try {
    const { name }: { name: string } = await request.json();
    const db = getDb();

    const existing = db.prepare("SELECT id FROM recipes WHERE name = ?").get(name) as { id: number } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Rezept nicht gefunden" }, { status: 404 });
    }

    // Ingredients werden durch ON DELETE CASCADE automatisch gelöscht
    db.prepare("DELETE FROM recipes WHERE id = ?").run(existing.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// PATCH - Kategorie für mehrere Rezepte aktualisieren (wenn Kategorie umbenannt wird)
export async function PATCH(request: Request) {
  try {
    const { oldCategory, newCategory }: { oldCategory: string; newCategory: string } =
      await request.json();
    const db = getDb();

    const info = db
      .prepare("UPDATE recipes SET category = ? WHERE category = ?")
      .run(newCategory, oldCategory);

    return NextResponse.json({ success: true, updated: info.changes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
