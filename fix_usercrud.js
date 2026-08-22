const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/usercrud.ts', 'utf8');

c = c.replace(
  'storeLevel?: boolean;',
  'storeLevel?: boolean;\n  globalLevel?: boolean;'
);

c = c.replace(
  'function buildUrl(tenantId: string, module: string, storeLevel: boolean, id?: string): string {',
  'function buildUrl(tenantId: string, module: string, storeLevel: boolean, id?: string, globalLevel?: boolean): string {\n  if (globalLevel) { const b = `/v1/${module}`; return id ? `${b}/${id}` : b; }'
);

c = c.replace(
  'const { module, tenantId, storeLevel = true, initialData, optimistic, onError, onSuccess, defaultParams } = opts;',
  'const { module, tenantId, storeLevel = true, globalLevel = false, initialData, optimistic, onError, onSuccess, defaultParams } = opts;'
);

c = c.replace(
  /const url = buildUrl\(tenantId, module, storeLevel\);/g,
  'const url = buildUrl(tenantId, module, storeLevel, undefined, globalLevel);'
);

c = c.replace(
  /const url = buildUrl\(tenantId, module, storeLevel, id\);/g,
  'const url = buildUrl(tenantId, module, storeLevel, id, globalLevel);'
);

fs.writeFileSync('app/admin/dynamic/usercrud.ts', c);
console.log('Fixed usercrud.ts');
