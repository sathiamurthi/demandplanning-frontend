const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/usercrud.ts', 'utf8');

c = c.replace(
  '  globalLevel?: boolean;\n  /** true = hits global /v1/{module} directly */\n  globalLevel?: boolean;',
  '  /** true = hits global /v1/{module} directly */\n  globalLevel?: boolean;'
);

c = c.replace(
  '  globalLevel?: boolean;\r\n  /** true = hits global /v1/{module} directly */\r\n  globalLevel?: boolean;',
  '  /** true = hits global /v1/{module} directly */\n  globalLevel?: boolean;'
);

fs.writeFileSync('app/admin/dynamic/usercrud.ts', c);
console.log('Fixed');
