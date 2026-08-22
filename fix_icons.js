const fs = require('fs');
let c = fs.readFileSync('app/admin/sidebar.tsx', 'utf8');
c = c.replace(/import \{([^}]+)\} from "lucide-react";/, 'import { $1, Clock, Calendar } from "lucide-react";');
fs.writeFileSync('app/admin/sidebar.tsx', c);
