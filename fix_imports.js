const fs = require('fs');
let c = fs.readFileSync('app/admin/sidebar.tsx', 'utf8');
c = c.replace(/import \{[\s\S]*?\} from "lucide-react";/, `import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  MenuSquare,
  BarChart3,
  LogOut,
  FolderTree,
  ListOrdered,
  Settings2,
  Tag,
  Package,
  ShoppingCart,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
  X,
  BookOpen,
  Wallet,
  Clock,
  Calendar
} from "lucide-react";`);
fs.writeFileSync('app/admin/sidebar.tsx', c);
