const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/usercrud.ts', 'utf8');

c = c.replace(/const res = await req<{ data: T\[\] }>\("GET", url\);[\s\S]*?onSuccess\?\.\("fetch"\);/m, `const res = await req<any>("GET", url);
        let arr: T[] = [];
        if (res && res.data) {
          if (Array.isArray(res.data)) arr = res.data;
          else if (res.data.items && Array.isArray(res.data.items)) arr = res.data.items;
        } else if (res && Array.isArray(res)) {
          arr = res;
        }
        setItems(arr);
        onSuccess?.("fetch");`);

fs.writeFileSync('app/admin/dynamic/usercrud.ts', c);
