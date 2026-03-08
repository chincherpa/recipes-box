import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "..", "recipes.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  initSchema(_db);
  runMigrationIfNeeded(_db);

  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL UNIQUE,
      icon  TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL UNIQUE,
      category  TEXT NOT NULL DEFAULT '',
      bemerkung TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id  INTEGER NOT NULL,
      zutat      TEXT NOT NULL DEFAULT '',
      menge      TEXT NOT NULL DEFAULT '',
      taetigkeit TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );
  `);
}

function runMigrationIfNeeded(db: Database.Database): void {
  // Nur migrieren wenn DB leer ist
  const count = (db.prepare("SELECT COUNT(*) as n FROM categories").get() as { n: number }).n;
  if (count > 0) return;

  const categoriesPath = path.join(process.cwd(), "..", "categories.json");
  const csvPath = path.join(process.cwd(), "..", "rezepte.csv");

  // Kategorien aus JSON importieren
  if (fs.existsSync(categoriesPath)) {
    try {
      const raw = fs.readFileSync(categoriesPath, "utf-8");
      const data = JSON.parse(raw) as { categories: { id: string; name: string; icon: string; color: string }[] };
      const insertCat = db.prepare(
        "INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)"
      );
      const txCat = db.transaction((cats: typeof data.categories) => {
        for (const c of cats) {
          insertCat.run(c.id, c.name, c.icon, c.color);
        }
      });
      txCat(data.categories);
      console.log(`[DB] ${data.categories.length} Kategorien importiert.`);
    } catch (e) {
      console.error("[DB] Fehler beim Kategorien-Import:", e);
    }
  }

  // Rezepte aus CSV importieren
  if (fs.existsSync(csvPath)) {
    try {
      const raw = fs.readFileSync(csvPath, "utf-8");
      const lines = raw.split(/\r?\n/);
      if (lines.length < 2) return;

      // Header parsen
      const header = parseCsvLine(lines[0]);
      const idx = {
        kategorie: header.indexOf("Kategorie"),
        gericht: header.indexOf("Gericht"),
        zutat: header.indexOf("Zutat"),
        menge: header.indexOf("Menge"),
        taetigkeit: header.indexOf("Tätigkeit"),
        bemerkung: header.indexOf("Bemerkung"),
      };

      // Rezepte gruppieren
      type RecipeMap = Map<string, { category: string; bemerkung: string; ingredients: { zutat: string; menge: string; taetigkeit: string }[] }>;
      const recipes: RecipeMap = new Map();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCsvLine(line);
        const name = cols[idx.gericht]?.trim();
        if (!name) continue;

        if (!recipes.has(name)) {
          recipes.set(name, {
            category: cols[idx.kategorie]?.trim() || "",
            bemerkung: cols[idx.bemerkung]?.trim() || "",
            ingredients: [],
          });
        }
        recipes.get(name)!.ingredients.push({
          zutat: cols[idx.zutat]?.trim() || "",
          menge: cols[idx.menge]?.trim() || "",
          taetigkeit: cols[idx.taetigkeit]?.trim() || "",
        });
      }

      const insertRecipe = db.prepare(
        "INSERT OR IGNORE INTO recipes (name, category, bemerkung) VALUES (?, ?, ?)"
      );
      const insertIng = db.prepare(
        "INSERT INTO ingredients (recipe_id, zutat, menge, taetigkeit, sort_order) VALUES (?, ?, ?, ?, ?)"
      );

      const txRecipes = db.transaction((entries: [string, RecipeMap extends Map<string, infer V> ? V : never][]) => {
        for (const [name, recipe] of entries) {
          insertRecipe.run(name, recipe.category, recipe.bemerkung);
          const row = db.prepare("SELECT id FROM recipes WHERE name = ?").get(name) as { id: number } | undefined;
          if (!row) continue;
          recipe.ingredients.forEach((ing, i) => {
            insertIng.run(row.id, ing.zutat, ing.menge, ing.taetigkeit, i);
          });
        }
      });

      txRecipes([...recipes.entries()]);
      console.log(`[DB] ${recipes.size} Rezepte importiert.`);
    } catch (e) {
      console.error("[DB] Fehler beim Rezept-Import:", e);
    }
  }
}

/**
 * Einfacher CSV-Parser der auch Felder mit Kommas in Anführungszeichen behandelt.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  result.push(field);
  return result;
}
