export const BOOKING_PRIORITIES = [
  { value: "", label: "All" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "emergency", label: "Emergency" },
];

export const LIFECYCLE_STATES = [
  { value: "", label: "All" },
  { value: "CREATED", label: "Created" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const BULK_ACTIONS = [
  { value: "auto_assign", label: "Auto-assign" },
  { value: "escalate", label: "Escalate" },
  { value: "emergency", label: "Mark emergency" },
  { value: "complete", label: "Force complete" },
];

export const BOOKING_WORKFLOW_NAV = [
  { href: "/admin/booking-management/workflow", label: "Queue", exact: true },
];
