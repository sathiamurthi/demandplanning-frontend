const fs = require('fs');
let c = fs.readFileSync('app/admin/dynamic/entityconfigs.tsx', 'utf8');

if (!c.includes('export const attendanceConfig: any = {')) {
  c += `

export const attendanceConfig: any = {
  module: "attendance",
  storeLevel: true,
  title: "Attendance",
  singular: "Attendance Record",
  fields: [
    { key: "user_id", label: "Employee", type: "text", required: true },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "check_in_time", label: "Check-in Time", type: "time" },
    { key: "check_out_time", label: "Check-out Time", type: "time" },
    { key: "status", label: "Status", type: "select", options: [
      { label: "Present", value: "Present" },
      { label: "Absent", value: "Absent" },
      { label: "Leave", value: "Leave" }
    ], required: true },
    { key: "notes", label: "Notes", type: "text" }
  ],
  blankForm: { date: new Date().toISOString().split('T')[0], status: "Present" },
  searchKeys: ["user_name", "status"],
  toPayload: (f: any) => f,
  columns: [
    { key: "user_name", label: "Employee Name", render: (v: any) => <strong>{v}</strong> },
    { key: "date", label: "Date" },
    { key: "check_in_time", label: "Check-in" },
    { key: "check_out_time", label: "Check-out" },
    { key: "status", label: "Status" },
    { key: "notes", label: "Notes" }
  ]
};

export const timesheetsConfig: any = {
  module: "timesheets",
  storeLevel: true,
  title: "Timesheets",
  singular: "Timesheet",
  fields: [
    { key: "user_id", label: "Employee", type: "text", required: true },
    { key: "period_start", label: "Period Start", type: "date", required: true },
    { key: "period_end", label: "Period End", type: "date", required: true },
    { key: "total_hours", label: "Total Hours", type: "number", required: true },
    { key: "status", label: "Status", type: "select", options: [
      { label: "Draft", value: "Draft" },
      { label: "Submitted", value: "Submitted" },
      { label: "Approved", value: "Approved" },
      { label: "Rejected", value: "Rejected" }
    ], required: true }
  ],
  blankForm: { status: "Draft", total_hours: 0 },
  searchKeys: ["user_name", "status"],
  toPayload: (f: any) => f,
  columns: [
    { key: "user_name", label: "Employee Name", render: (v: any) => <strong>{v}</strong> },
    { key: "period_start", label: "Start Date" },
    { key: "period_end", label: "End Date" },
    { key: "total_hours", label: "Total Hours" },
    { key: "status", label: "Status" }
  ]
};
`;
}

fs.writeFileSync('app/admin/dynamic/entityconfigs.tsx', c);
