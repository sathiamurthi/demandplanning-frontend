const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('route.ts')) {
      results.push(file);
    }
  });
  return results;
}
const routes = walk('app/api');
routes.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes("export const runtime = 'edge';")) {
    c = c.replace(/export const runtime = 'edge';/g, 'export const maxDuration = 60;');
    fs.writeFileSync(f, c);
    console.log('Updated ' + f);
  }
});
