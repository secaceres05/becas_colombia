const fs = require('fs');
const fixes = JSON.parse(fs.readFileSync('C:/Users/JUAN/AppData/Local/Temp/opencode/slug_fixes.json', 'utf8'));
const lines = fixes.map(u => {
  const slug = u['new'].replace(/'/g, "''");
  return `UPDATE scholarships SET slug = '${slug}' WHERE id = ${u.id};`;
});
fs.writeFileSync('C:/Users/JUAN/AppData/Local/Temp/opencode/slug_fixes.sql', lines.join('\n') + '\n');
console.log(lines.length, 'statements ->', lines.join('\n'));