import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// GET - Alle Kategorien lesen
export async function GET() {
  try {
    const db = getDb();
    const categories = db
      .prepare("SELECT id, name, icon, color FROM categories ORDER BY name")
      .all() as Category[];
    return NextResponse.json(categories);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// POST - Neue Kategorie hinzufügen
export async function POST(request: Request) {
  try {
    const newCategory: Category = await request.json();
    const db = getDb();

    // ID generieren falls nicht vorhanden
    if (!newCategory.id) {
      newCategory.id = newCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 20);
    }

    const existing = db
      .prepare("SELECT id FROM categories WHERE id = ? OR LOWER(name) = LOWER(?)")
      .get(newCategory.id, newCategory.name);

    if (existing) {
      return NextResponse.json({ error: "Kategorie existiert bereits" }, { status: 400 });
    }

    db.prepare("INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)").run(
      newCategory.id,
      newCategory.name,
      newCategory.icon,
      newCategory.color
    );

    return NextResponse.json(newCategory, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// PUT - Kategorie aktualisieren
export async function PUT(request: Request) {
  try {
    const { originalId, category }: { originalId: string; category: Category } =
      await request.json();
    const db = getDb();

    const existing = db.prepare("SELECT id FROM categories WHERE id = ?").get(originalId);
    if (!existing) {
      return NextResponse.json({ error: "Kategorie nicht gefunden" }, { status: 404 });
    }

    if (originalId !== category.id) {
      const duplicate = db.prepare("SELECT id FROM categories WHERE id = ?").get(category.id);
      if (duplicate) {
        return NextResponse.json(
          { error: "Eine Kategorie mit diesem Namen existiert bereits" },
          { status: 400 }
        );
      }
    }

    db.prepare(
      "UPDATE categories SET id = ?, name = ?, icon = ?, color = ? WHERE id = ?"
    ).run(category.id, category.name, category.icon, category.color, originalId);

    return NextResponse.json({ category, originalName: category.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// DELETE - Kategorie löschen
export async function DELETE(request: Request) {
  try {
    const { id }: { id: string } = await request.json();
    const db = getDb();

    const existing = db.prepare("SELECT id, name, icon, color FROM categories WHERE id = ?").get(
      id
    ) as Category | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Kategorie nicht gefunden" }, { status: 404 });
    }

    db.prepare("DELETE FROM categories WHERE id = ?").run(id);

    return NextResponse.json({ success: true, deletedCategory: existing });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
