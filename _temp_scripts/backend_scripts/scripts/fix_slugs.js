const slugify = require('slugify');
const fs = require('fs');

const rows = fs.readFileSync('C:/Users/JUAN/AppData/Local/Temp/opencode/all_slugs.csv', 'utf8').split('\n');
const all = [];
for (const line of rows) {
  if (!line.trim()) continue;
  const parts = line.split('|');
  if (parts.length < 3) continue;
  all.push({ id: Number(parts[0]), title: parts[1], slug: parts[2] });
}

const existingSlugs = new Set(all.map(r => r.slug));

const idsToFix = [6, 8, 15, 20, 26, 28, 37, 40, 52, 80, 86, 95, 106, 111, 121, 129, 131];
const byId = new Map(all.map(r => [r.id, r]));

function uniqueSlug(base, taken) {
  let slug = base;
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  taken.add(slug);
  return slug;
}

const updates = [];
for (const id of idsToFix) {
  const rec = byId.get(id);
  if (!rec) { console.log(`ID ${id} no encontrado`); continue; }
  const base = slugify(rec.title, { lower: true, strict: true });
  const slug = uniqueSlug(base, existingSlugs);
  updates.push({ id, old: rec.slug, new: slug });
}

console.log('UPDATEs a aplicar:');
for (const u of updates) {
  console.log(`  ${u.id}: ${u.old} -> ${u.new}`);
}

fs.writeFileSync('C:/Users/JUAN/AppData/Local/Temp/opencode/slug_fixes.json', JSON.stringify(updates, null, 2));