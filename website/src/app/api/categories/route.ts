import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoriesData {
  categories: Category[];
}

const CATEGORIES_PATH = path.join(process.cwd(), "..", "categories.json");

async function readCategories(): Promise<Category[]> {
  try {
    const content = await fs.readFile(CATEGORIES_PATH, "utf-8");
    const data: CategoriesData = JSON.parse(content);
    return data.categories;
  } catch {
    return [];
  }
}

async function writeCategories(categories: Category[]): Promise<void> {
  const data: CategoriesData = { categories };
  await fs.writeFile(CATEGORIES_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET - Alle Kategorien lesen
export async function GET() {
  const categories = await readCategories();
  return NextResponse.json(categories);
}

// POST - Neue Kategorie hinzufügen
export async function POST(request: Request) {
  const newCategory: Category = await request.json();
  const categories = await readCategories();

  // ID generieren falls nicht vorhanden
  if (!newCategory.id) {
    newCategory.id = newCategory.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);
  }

  // Prüfen ob Kategorie schon existiert
  const exists = categories.some(
    (c) => c.id === newCategory.id || c.name.toLowerCase() === newCategory.name.toLowerCase()
  );
  if (exists) {
    return NextResponse.json(
      { error: "Kategorie existiert bereits" },
      { status: 400 }
    );
  }

  categories.push(newCategory);
  await writeCategories(categories);

  return NextResponse.json(newCategory, { status: 201 });
}

// PUT - Kategorie aktualisieren
export async function PUT(request: Request) {
  const { originalId, category }: { originalId: string; category: Category } =
    await request.json();
  const categories = await readCategories();

  const index = categories.findIndex((c) => c.id === originalId);
  if (index < 0) {
    return NextResponse.json(
      { error: "Kategorie nicht gefunden" },
      { status: 404 }
    );
  }

  // Wenn Name geändert wurde, prüfen ob neuer Name schon existiert
  if (originalId !== category.id) {
    const duplicate = categories.findIndex((c) => c.id === category.id);
    if (duplicate >= 0) {
      return NextResponse.json(
        { error: "Eine Kategorie mit diesem Namen existiert bereits" },
        { status: 400 }
      );
    }
  }

  categories[index] = category;
  await writeCategories(categories);

  return NextResponse.json({ category, originalName: categories[index]?.name });
}

// DELETE - Kategorie löschen
export async function DELETE(request: Request) {
  const { id }: { id: string } = await request.json();
  const categories = await readCategories();

  const index = categories.findIndex((c) => c.id === id);
  if (index < 0) {
    return NextResponse.json(
      { error: "Kategorie nicht gefunden" },
      { status: 404 }
    );
  }

  const deletedCategory = categories[index];
  categories.splice(index, 1);
  await writeCategories(categories);

  return NextResponse.json({ success: true, deletedCategory });
}
