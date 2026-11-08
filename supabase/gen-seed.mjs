// Erzeugt supabase/seed.sql aus rezepte.csv + categories.json (einmalig).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

function parseLine(line) {
  const out = [];
  let f = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { f += '"'; i++; } else inQ = !inQ;
    } else if (ch === "," && !inQ) { out.push(f); f = ""; }
    else f += ch;
  }
  out.push(f);
  return out;
}

const cats = JSON.parse(fs.readFileSync(path.join(root, "categories.json"), "utf-8")).categories;
const lines = fs.readFileSync(path.join(root, "rezepte.csv"), "utf-8").split(/\r?\n/);
const h = parseLine(lines[0]);
const ix = Object.fromEntries(["Kategorie", "Gericht", "Zutat", "Menge", "Tätigkeit", "Bemerkung"].map((k) => [k, h.indexOf(k)]));

const recipes = new Map();
for (const line of lines.slice(1)) {
  if (!line.trim()) continue;
  const c = parseLine(line);
  const name = c[ix.Gericht]?.trim();
  if (!name) continue;
  if (!recipes.has(name)) recipes.set(name, { cat: c[ix.Kategorie]?.trim() || "", bem: c[ix.Bemerkung]?.trim() || "", ings: [] });
  recipes.get(name).ings.push([c[ix.Zutat]?.trim() || "", c[ix.Menge]?.trim() || "", c[ix["Tätigkeit"]]?.trim() || ""]);
}

let sql = "-- Generiert aus rezepte.csv + categories.json. Nach schema.sql ausfuehren.\nbegin;\n\n";
sql += "insert into public.categories (id, name, icon, color) values\n";
sql += cats.map((c) => `  (${q(c.id)}, ${q(c.name)}, ${q(c.icon)}, ${q(c.color)})`).join(",\n");
sql += "\non conflict (id) do nothing;\n\n";
sql += "insert into public.recipes (name, category, bemerkung) values\n";
sql += [...recipes].map(([n, r]) => `  (${q(n)}, ${q(r.cat)}, ${q(r.bem)})`).join(",\n");
sql += "\non conflict (name) do nothing;\n\n";
sql += "insert into public.ingredients (recipe_id, zutat, menge, taetigkeit, sort_order)\nselect r.id, v.zutat, v.menge, v.taetigkeit, v.ord\nfrom (values\n";
const rows = [];
for (const [n, r] of recipes) r.ings.forEach((i, o) => rows.push(`  (${q(n)}, ${q(i[0])}, ${q(i[1])}, ${q(i[2])}, ${o})`));
sql += rows.join(",\n");
sql += "\n) as v(rname, zutat, menge, taetigkeit, ord)\njoin public.recipes r on r.name = v.rname;\n\ncommit;\n";

fs.writeFileSync(path.join(root, "supabase", "seed.sql"), sql);
console.log(`${cats.length} Kategorien, ${recipes.size} Rezepte, ${rows.length} Zutaten`);
