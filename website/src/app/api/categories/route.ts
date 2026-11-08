import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const COLS = "id, name, icon, color";

function dbError(e: unknown) {
  console.error(e);
  return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
}

// GET - Alle Kategorien lesen
export async function GET() {
  try {
    const { data, error } = await getSupabase().from("categories").select(COLS).order("name");
    if (error) throw error;
    return NextResponse.json(data as Category[]);
  } catch (e) {
    return dbError(e);
  }
}

// POST - Neue Kategorie hinzufügen
export async function POST(request: Request) {
  try {
    const newCategory: Category = await request.json();
    const sb = getSupabase();

    if (!newCategory.id) {
      newCategory.id = newCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 20);
    }

    const { data: all, error: selErr } = await sb.from("categories").select("id, name");
    if (selErr) throw selErr;
    const lower = newCategory.name.toLowerCase();
    if (all?.some((c) => c.id === newCategory.id || c.name.toLowerCase() === lower)) {
      return NextResponse.json({ error: "Kategorie existiert bereits" }, { status: 400 });
    }

    const { error } = await sb.from("categories").insert({
      id: newCategory.id,
      name: newCategory.name,
      icon: newCategory.icon,
      color: newCategory.color,
    });
    if (error) throw error;

    return NextResponse.json(newCategory, { status: 201 });
  } catch (e) {
    return dbError(e);
  }
}

// PUT - Kategorie aktualisieren
export async function PUT(request: Request) {
  try {
    const { originalId, category }: { originalId: string; category: Category } =
      await request.json();
    const sb = getSupabase();

    const { data: existing, error: e1 } = await sb
      .from("categories")
      .select("id")
      .eq("id", originalId)
      .maybeSingle();
    if (e1) throw e1;
    if (!existing) {
      return NextResponse.json({ error: "Kategorie nicht gefunden" }, { status: 404 });
    }

    if (originalId !== category.id) {
      const { data: duplicate, error: e2 } = await sb
        .from("categories")
        .select("id")
        .eq("id", category.id)
        .maybeSingle();
      if (e2) throw e2;
      if (duplicate) {
        return NextResponse.json(
          { error: "Eine Kategorie mit diesem Namen existiert bereits" },
          { status: 400 }
        );
      }
    }

    const { error } = await sb
      .from("categories")
      .update({ id: category.id, name: category.name, icon: category.icon, color: category.color })
      .eq("id", originalId);
    if (error) throw error;

    return NextResponse.json({ category, originalName: category.name });
  } catch (e) {
    return dbError(e);
  }
}

// DELETE - Kategorie löschen
export async function DELETE(request: Request) {
  try {
    const { id }: { id: string } = await request.json();
    const sb = getSupabase();

    const { data: existing, error: e1 } = await sb
      .from("categories")
      .select(COLS)
      .eq("id", id)
      .maybeSingle();
    if (e1) throw e1;
    if (!existing) {
      return NextResponse.json({ error: "Kategorie nicht gefunden" }, { status: 404 });
    }

    const { error } = await sb.from("categories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, deletedCategory: existing as Category });
  } catch (e) {
    return dbError(e);
  }
}
