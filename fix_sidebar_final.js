const fs = require('fs');
let c = fs.readFileSync('app/admin/sidebar.tsx', 'utf8');

c = c.replace(/import \{([\s\S]*?)\} from "lucide-react";/, (match, p1) => {
  return `import {${p1}, Clock, Calendar} from "lucide-react";`;
});

const injection = `          {
            title: "HR & Staff",
            items: [
              { title: "Attendance", url: "/admin/dynamic/attendance", icon: Calendar },
              { title: "Timesheets", url: "/admin/dynamic/timesheets", icon: Clock },
              { title: "Employees", url: "/admin/dynamic/users", icon: Users },
            ]
          },
          {
            title: "Settings",`;

c = c.replace(/\{\s*title: "Settings",/, injection);

fs.writeFileSync('app/admin/sidebar.tsx', c);
