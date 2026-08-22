const fs = require('fs');

let j = fs.readFileSync('app/admin/dynamic/accounting/journal/page.tsx', 'utf8');
j = j.replace('setEntries(jRes);', 'setEntries(jRes.data || jRes);');
j = j.replace('setAccounts(cRes);', 'setAccounts(cRes.data || cRes);');
fs.writeFileSync('app/admin/dynamic/accounting/journal/page.tsx', j);

let l = fs.readFileSync('app/admin/dynamic/accounting/ledger/page.tsx', 'utf8');
l = l.replace('setAccounts(cRes);', 'setAccounts(cRes.data || cRes);');
l = l.replace('setLines(lRes);', 'setLines(lRes.data || lRes);');
fs.writeFileSync('app/admin/dynamic/accounting/ledger/page.tsx', l);

console.log('Fixed journal and ledger');
