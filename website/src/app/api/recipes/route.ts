import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";

interface RecipeRow {
  Kategorie: string;
  Gericht: string;
  Zutat: string;
  Menge: string;
  Tätigkeit: string;
}

interface Recipe {
  name: string;
  category: string;
  ingredients: {
    zutat: string;
    menge: string;
    taetigkeit: string;
  }[];
}

const CSV_PATH = path.join(process.cwd(), "..", "rezepte.csv");

async function readCSV(): Promise<Recipe[]> {
  try {
    const content = await fs.readFile(CSV_PATH, "utf-8");
    const results = Papa.parse<RecipeRow>(content, {
      header: true,
      skipEmptyLines: true,
    });

    const grouped = new Map<string, Recipe>();

    results.data.forEach((row) => {
      const name = row.Gericht?.trim();
      if (!name) return;

      if (!grouped.has(name)) {
        grouped.set(name, {
          name,
          category: row.Kategorie?.trim() || "",
          ingredients: []
        });
      }

      grouped.get(name)!.ingredients.push({
        zutat: row.Zutat?.trim() || "",
        menge: row.Menge?.trim() || "",
        taetigkeit: row.Tätigkeit?.trim() || "",
      });
    });

    return Array.from(grouped.values());
  } catch {
    return [];
  }
}

async function writeCSV(recipes: Recipe[]): Promise<void> {
  const rows: RecipeRow[] = [];

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ing) => {
      rows.push({
        Kategorie: recipe.category,
        Gericht: recipe.name,
        Zutat: ing.zutat,
        Menge: ing.menge,
        Tätigkeit: ing.taetigkeit,
      });
    });
  });

  const csv = Papa.unparse(rows, {
    header: true,
    columns: ["Kategorie", "Gericht", "Zutat", "Menge", "Tätigkeit"],
  });

  await fs.writeFile(CSV_PATH, csv, "utf-8");
}

// GET - Alle Rezepte lesen
export async function GET() {
  const recipes = await readCSV();
  return NextResponse.json(recipes);
}

// POST - Neues Rezept hinzufügen
export async function POST(request: Request) {
  const newRecipe: Recipe = await request.json();
  const recipes = await readCSV();

  // Prüfen ob Rezept schon existiert
  const existingIndex = recipes.findIndex((r) => r.name === newRecipe.name);
  if (existingIndex >= 0) {
    return NextResponse.json(
      { error: "Rezept existiert bereits" },
      { status: 400 }
    );
  }

  recipes.push(newRecipe);
  await writeCSV(recipes);

  return NextResponse.json(newRecipe, { status: 201 });
}

// PUT - Rezept aktualisieren
export async function PUT(request: Request) {
  const { originalName, recipe }: { originalName: string; recipe: Recipe } =
    await request.json();
  const recipes = await readCSV();

  const index = recipes.findIndex((r) => r.name === originalName);
  if (index < 0) {
    return NextResponse.json(
      { error: "Rezept nicht gefunden" },
      { status: 404 }
    );
  }

  // Wenn Name geändert wurde, prüfen ob neuer Name schon existiert
  if (originalName !== recipe.name) {
    const duplicate = recipes.findIndex((r) => r.name === recipe.name);
    if (duplicate >= 0) {
      return NextResponse.json(
        { error: "Ein Rezept mit diesem Namen existiert bereits" },
        { status: 400 }
      );
    }
  }

  recipes[index] = recipe;
  await writeCSV(recipes);

  return NextResponse.json(recipe);
}

// DELETE - Rezept löschen
export async function DELETE(request: Request) {
  const { name }: { name: string } = await request.json();
  const recipes = await readCSV();

  const index = recipes.findIndex((r) => r.name === name);
  if (index < 0) {
    return NextResponse.json(
      { error: "Rezept nicht gefunden" },
      { status: 404 }
    );
  }

  recipes.splice(index, 1);
  await writeCSV(recipes);

  return NextResponse.json({ success: true });
}

// PATCH - Kategorie für mehrere Rezepte aktualisieren (wenn Kategorie umbenannt wird)
export async function PATCH(request: Request) {
  const { oldCategory, newCategory }: { oldCategory: string; newCategory: string } =
    await request.json();
  const recipes = await readCSV();

  let updated = 0;
  recipes.forEach((recipe) => {
    if (recipe.category === oldCategory) {
      recipe.category = newCategory;
      updated++;
    }
  });

  await writeCSV(recipes);

  return NextResponse.json({ success: true, updated });
}
