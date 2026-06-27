import { User } from "@/lib/types";

export const DUMMY_USERS: any[] = [
  {
    id: "1",
    first_name: "Owner",
    last_name: "",
    email: "owner@demo.com",
    role: "owner",
    is_active: true,
    last_login_at: null,
  },
  {
    id: "2",
    first_name: "Manager",
    last_name: "",
    email: "manager@demo.com",
    role: "manager",
    is_active: true,
    last_login_at: null,
  },
  {
    id: "3",
    first_name: "Staff",
    last_name: "",
    email: "staff@demo.com",
    role: "staff",
    is_active: false,
    last_login_at: null,
  },
];