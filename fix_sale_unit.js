const fs = require('fs');
let c = fs.readFileSync('app/admin/[storeId]/sale/page.tsx', 'utf8');
c = c.replace(/unitId: l\.unitId \|\| undefined,/g, 'unitId: (l.unitId && l.unitId !== "null" && l.unitId.length > 10) ? l.unitId : undefined,');
fs.writeFileSync('app/admin/[storeId]/sale/page.tsx', c);
