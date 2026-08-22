const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');
c = c.replace(/variant="outline"/g, 'variant="secondary"');
fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
