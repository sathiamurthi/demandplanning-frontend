const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');
c = c.replace(/type: "switch"/g, 'type: "toggle"');
fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
console.log('Fixed toggle');
