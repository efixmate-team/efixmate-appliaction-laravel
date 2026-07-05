/** Admin UI palette — hex codes (avoid Tailwind color class names in logic). */

export const ADMIN_BRAND = {
  primary: "#0e55d9",
  primaryLight: "#2563eb",
  pageBg: "#F5F7FA",
} as const;

export const STATUS_BADGE_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  COMPLETED: { bg: "#ecfdf5", text: "#047857", dot: "#10b981" },
  PENDING: { bg: "#fffbeb", text: "#b45309", dot: "#f59e0b" },
  CANCELLED: { bg: "#fef2f2", text: "#b91c1c", dot: "#ef4444" },
  IN_PROGRESS: { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  BROADCASTED: { bg: "#f5f3ff", text: "#6d28d9", dot: "#8b5cf6" },
};

export const STATUS_BAR_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
] as const;

export const TREND_COLORS = {
  up: { bg: "#ecfdf5", text: "#059669" },
  down: { bg: "#fef2f2", text: "#dc2626" },
  neutral: { bg: "#f1f5f9", text: "#64748b" },
} as const;

export const KPI_CARD_THEMES = {
  revenue: {
    gradientFrom: "#10b981",
    gradientTo: "#0d9488",
    ring: "#d1fae5",
  },
  bookings: {
    gradientFrom: "#3b82f6",
    gradientTo: "#4f46e5",
    ring: "#dbeafe",
  },
  technicians: {
    gradientFrom: "#8b5cf6",
    gradientTo: "#9333ea",
    ring: "#ede9fe",
  },
  customers: {
    gradientFrom: "#f97316",
    gradientTo: "#f59e0b",
    ring: "#ffedd5",
  },
} as const;

export const CHART_GRADIENTS = {
  bookings: { from: "#6366f1", to: "#3b82f6" },
  revenue: { from: "#10b981", to: "#14b8a6" },
} as const;

/** Default service category colors (match seed + home tiles). */
export const SERVICE_CATEGORY_COLORS: Record<string, string> = {
  "Electrical Services": "#d97706",
  "Plumbing Services": "#2563eb",
  "HVAC & Appliance Services": "#0284c7",
  "Carpentry & Furniture Services": "#ea580c",
  "Painting Services": "#db2777",
  "Cleaning Services": "#059669",
  "Pest Control Services": "#16a34a",
};
