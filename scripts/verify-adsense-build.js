const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '.next');
const query = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1642832204354188';
const results = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p);
    } else if (/\.(js|mjs|html|json|txt)$/.test(name)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        if (content.includes(query)) {
          results.push(p);
          if (results.length >= 20) return;
        }
      } catch (e) {
        // ignore unreadable files
      }
    }
  }
}
walk(root);
if (results.length === 0) {
  console.log('NOT_FOUND');
} else {
  console.log(results.join('\n'));
}
