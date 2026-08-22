const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

const unitsConfig = `
export const unitsConfig: any = {
  module: "units",
  globalLevel: true, // Calls /v1/units
  title: "Unit Types",
  singular: "Unit",
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "symbol", label: "Symbol", type: "text", required: true },
    { name: "category", label: "Category", type: "select", options: [
      { label: "Count", value: "count" },
      { label: "Weight", value: "weight" },
      { label: "Volume", value: "volume" },
      { label: "Length", value: "length" }
    ] },
    { name: "is_active", label: "Active", type: "switch" }
  ],
  blankForm: { name: "", symbol: "", category: "count", is_active: true },
  searchKeys: ["name", "symbol"],
  toPayload: (f: any) => f,
  columns: [
    { key: "name", label: "Name", render: (v: any) => <strong>{v}</strong> },
    { key: "symbol", label: "Symbol" },
    { key: "category", label: "Category" },
    { key: "is_active", label: "Status", render: (v: any) => (v ? "Active" : "Inactive") }
  ],
  renderCard: (item: any) => (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{item.name}</h3>
      <p className="text-sm text-gray-500">{item.symbol} - {item.category}</p>
    </div>
  )
};
`;

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c + "\n" + unitsConfig);
console.log('unitsConfig appended');
