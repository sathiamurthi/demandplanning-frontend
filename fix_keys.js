const fs = require('fs');

let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

c = c.replace(
  /{ name: "customer_name",/g,
  '{ key: "customer_name",'
).replace(
  /{ name: "company_name",/g,
  '{ key: "company_name",'
).replace(
  /{ name: "phone",/g,
  '{ key: "phone",'
).replace(
  /{ name: "email",/g,
  '{ key: "email",'
).replace(
  /{ name: "status",/g,
  '{ key: "status",'
).replace(
  /{ name: "value",/g,
  '{ key: "value",'
).replace(
  /{ name: "issue_date",/g,
  '{ key: "issue_date",'
).replace(
  /{ name: "order_date",/g,
  '{ key: "order_date",'
).replace(
  /{ name: "sale_date",/g,
  '{ key: "sale_date",'
).replace(
  /{ name: "total_amount",/g,
  '{ key: "total_amount",'
).replace(
  /{ name: "name", label:/g,
  '{ key: "name", label:'
).replace(
  /{ name: "symbol", label:/g,
  '{ key: "symbol", label:'
).replace(
  /{ name: "category", label:/g,
  '{ key: "category", label:'
).replace(
  /{ name: "is_active", label:/g,
  '{ key: "is_active", label:'
);

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
console.log('Fixed field keys');
