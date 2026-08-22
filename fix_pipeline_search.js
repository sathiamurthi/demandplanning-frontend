const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/PipelineDocumentForm.tsx', 'utf8');

c = c.replace(/setItems\(res\.data \|\| res \|\| \[\]\);/g, `
        const data = res.data || res || [];
        setItems(Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []));
`);

fs.writeFileSync('app/admin/dynamic/PipelineDocumentForm.tsx', c);
