/**
 * Admin setup order derived from Prisma / DB dependencies.
 *
 * Phase 1 — Lookups (standalone reference data):
 *   currencies / timezones / languages → needed by Countries
 *   units / booking-types → needed by Services (JSON cols: unit_ids, booking_type_ids)
 *   area-types → needed by Service Areas (area_type_id)
 *
 * Phase 2 — Geography (hierarchical):
 *   countries → states → cities → areas
 *
 * Phase 3 — Service catalog (grouped together for clarity):
 *   charges / taxes / discounts / coupons → standalone finance data; must exist before Services
 *   service-categories → services (category_id FK)
 *   ↳ Service Categories and Services are kept adjacent so admin configures them as one unit
 *   ↳ Services comes AFTER all of the above so the form dropdowns are populated on first open
 *
 * Phase 4 — Operations (require services + areas):
 *   time-slots (area_id, service_id) → pricing-rules (slot_id optional)
 *   commissions → reference service / area when scoped
 *
 * Phase 5 — Marketing:
 *   promotions (may ref coupons for CTA code) → announcements
 */

export type SetupGuideStep = {
  step: number;
  phase: "lookups" | "masters";
  label: string;
  description: string;
  path: string;
  /** API endpoint to check — GET returns { pagination: { total } } or { data: [] }. */
  checkEndpoint: string;
  /** Human-readable prerequisites (shown in guide). */
  requires?: string[];
};

export const ADMIN_SETUP_FLOW: SetupGuideStep[] = [
  {
    step: 1,
    phase: "lookups",
    label: "Currencies",
    description: "Required before countries (currency_id) and billing",
    path: "/admin/lookups/currencies",
    checkEndpoint: "/master/currencies?limit=1",
  },
  {
    step: 2,
    phase: "lookups",
    label: "Timezones",
    description: "Map to countries via country–timezone after countries exist",
    path: "/admin/lookups/timezones",
    checkEndpoint: "/master/timezones?limit=1",
  },
  {
    step: 3,
    phase: "lookups",
    label: "Languages",
    description: "Map to countries via country–language after countries exist",
    path: "/admin/lookups/languages",
    checkEndpoint: "/master/languages?limit=1",
  },
  {
    step: 4,
    phase: "lookups",
    label: "Units",
    description: "Linked to services later (service ↔ unit map)",
    path: "/admin/lookups/units",
    checkEndpoint: "/master/units?limit=1",
  },
  {
    step: 5,
    phase: "lookups",
    label: "Booking Types",
    description: "Linked to services later (service ↔ booking type map)",
    path: "/admin/lookups/booking-types",
    checkEndpoint: "/master/booking-types?limit=1",
  },
  {
    step: 6,
    phase: "lookups",
    label: "Payment Modes",
    description: "Used on bookings (payment_mode_id)",
    path: "/admin/lookups/payment-modes",
    checkEndpoint: "/master/payment-modes?limit=1",
  },
  {
    step: 7,
    phase: "lookups",
    label: "Document Types",
    description: "Technician KYC documents",
    path: "/admin/lookups/document-types",
    checkEndpoint: "/master/document-types?limit=1",
  },
  {
    step: 8,
    phase: "lookups",
    label: "Area Types",
    description: "Optional on each service area (areas.area_type_id)",
    path: "/admin/lookups/area-types",
    checkEndpoint: "/master/area-types?limit=1",
  },
  {
    step: 9,
    phase: "masters",
    label: "Countries",
    description: "Set currency; link languages & timezones on the country record",
    path: "/admin/masters/geography/countries",
    checkEndpoint: "/master/countries?limit=1",
    requires: ["Currencies", "Languages", "Timezones"],
  },
  {
    step: 10,
    phase: "masters",
    label: "States",
    description: "Each state belongs to a country",
    path: "/admin/masters/geography/states",
    checkEndpoint: "/master/states?limit=1",
    requires: ["Countries"],
  },
  {
    step: 11,
    phase: "masters",
    label: "Cities",
    description: "Each city belongs to a state",
    path: "/admin/masters/geography/cities",
    checkEndpoint: "/master/cities?limit=1",
    requires: ["States"],
  },
  {
    step: 12,
    phase: "masters",
    label: "Service Areas",
    description: "Zones under a city; optional area type",
    path: "/admin/masters/geography/areas",
    checkEndpoint: "/master/areas?limit=1",
    requires: ["Cities", "Area Types"],
  },
  {
    step: 13,
    phase: "masters",
    label: "Charges",
    description: "Define platform fees here; link them to services on the Services screen",
    path: "/admin/masters/finance-management/charges",
    checkEndpoint: "/master/charges?limit=1",
  },
  {
    step: 14,
    phase: "masters",
    label: "Taxes",
    description: "GST / tax percentages used in checkout & invoices",
    path: "/admin/masters/finance-management/taxes",
    checkEndpoint: "/master/taxes?limit=1",
  },
  {
    step: 15,
    phase: "masters",
    label: "Discounts",
    description: "Define discount templates; link them to services on the Services screen",
    path: "/admin/masters/finance-management/discounts",
    checkEndpoint: "/master/discounts?limit=1",
  },
  {
    step: 16,
    phase: "masters",
    label: "Coupons",
    description: "Define coupon codes; link them to services on the Services screen",
    path: "/admin/masters/coupon-management/coupons",
    checkEndpoint: "/master/coupons?limit=1",
  },
  {
    step: 17,
    phase: "masters",
    label: "Service Categories",
    description: "Parent for services (services.category_id)",
    path: "/admin/masters/services-management/service-categories",
    checkEndpoint: "/master/service-categories?limit=1",
  },
  {
    step: 18,
    phase: "masters",
    label: "Services",
    description: "Map categories, units, booking types, charges, discounts & coupons",
    path: "/admin/masters/services-management/services",
    checkEndpoint: "/master/services?limit=1",
    requires: [
      "Service Categories",
      "Units",
      "Booking Types",
      "Charges",
      "Discounts",
      "Coupons",
    ],
  },
  {
    step: 19,
    phase: "masters",
    label: "Time Slots",
    description: "Per area + service (time_slots.area_id, service_id)",
    path: "/admin/masters/time-slot-management/time-slots",
    checkEndpoint: "/master/time-slots?limit=1",
    requires: ["Service Areas", "Services"],
  },
  {
    step: 20,
    phase: "masters",
    label: "Pricing Rules",
    description: "Overrides by service, area, city, or slot",
    path: "/admin/masters/pricing-rules",
    checkEndpoint: "/master/pricing-rules?limit=1",
    requires: ["Services", "Service Areas", "Time Slots (optional)"],
  },
  {
    step: 21,
    phase: "masters",
    label: "Commissions",
    description: "Optional — rules may reference service / area",
    path: "/admin/masters/finance-management/commissions",
    checkEndpoint: "/master/commissions?limit=1",
    requires: ["Services", "Service Areas"],
  },
  {
    step: 22,
    phase: "masters",
    label: "Promotions",
    description: "Banners, carousel & offer creatives for app home",
    path: "/admin/masters/announcement-management/promotions",
    checkEndpoint: "/master/promotions?limit=1",
    requires: ["Services", "Coupons (if CTA uses a code)"],
  },
  {
    step: 23,
    phase: "masters",
    label: "Announcements",
    description: "In-app text broadcasts to users or technicians",
    path: "/admin/masters/announcement-management/announcements",
    checkEndpoint: "/master/announcements?limit=1",
    requires: ["Promotions (optional)"],
  },
];

export const FIRST_SETUP_STEP = ADMIN_SETUP_FLOW[0];

/** True on any admin screen (setup guide stays visible everywhere in admin). */
export function isSetupGuideSection(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

export function findSetupStepIndex(pathname: string): number {
  let best = -1;
  let bestLen = 0;
  ADMIN_SETUP_FLOW.forEach((s, i) => {
    if (pathname.startsWith(s.path) && s.path.length > bestLen) {
      best = i;
      bestLen = s.path.length;
    }
  });
  return best;
}
