const slugify = require('slugify');
const fs = require('fs');

const rows = fs.readFileSync('C:/Users/JUAN/AppData/Local/Temp/opencode/all.csv', 'utf8').split('\n');
const results = [];
for (const line of rows) {
  if (!line.trim()) continue;
  const parts = line.split('|');
  if (parts.length < 3) continue;
  const id = parts[0], title = parts[1], slug = parts[2];
  const expected = slugify(title, { lower: true, strict: true });
  results.push({ id: Number(id), title, slug, expected, match: slug === expected });
}
fs.writeFileSync('C:/Users/JUAN/AppData/Local/Temp/opencode/slug_compare.json', JSON.stringify(results, null, 2));
console.log('total:', results.length, 'mismatches (npm slugify):', results.filter(r => !r.match).length);
for (const r of results.filter(r => !r.match)) {
  console.log(`  ${r.id} | ${r.title} | ${r.slug} | esperado: ${r.expected}`);
}