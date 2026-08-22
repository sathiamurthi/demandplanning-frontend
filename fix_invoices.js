const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

c = c.replace(
  '{ key: "sale_date", label: "Date", type: "date" },',
  '{ key: "status", label: "Status", type: "select", options: [{label:"Draft",value:"draft"},{label:"Issued",value:"issued"},{label:"Paid",value:"paid"},{label:"Overdue",value:"overdue"},{label:"Void",value:"void"}] },\n    { key: "sale_date", label: "Date", type: "date" },'
);

c = c.replace(
  '{ key: "sale_date", label: "Date" },',
  '{ key: "status", label: "Status" },\n    { key: "sale_date", label: "Date" },'
);

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
