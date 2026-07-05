/** Display + filter helpers for the user Offers page */

export type OfferTabId =
  | "all"
  | "best"
  | "first"
  | "seasonal"
  | "bank"
  | "plus";

export const OFFER_TABS: { id: OfferTabId; label: string }[] = [
  { id: "all", label: "All Coupons" },
  { id: "best", label: "Best Offers" },
  { id: "first", label: "First Order" },
  { id: "seasonal", label: "Seasonal Offers" },
  { id: "bank", label: "Bank Offers" },
  { id: "plus", label: "eFixMate Plus" },
];

export type CategoryBadgeKind = "flame" | "first" | "ac" | "crown" | "tag";

export type OfferCoupon = {
  id: string;
  code: string;
  stubLabel: string;
  stubColor: string;
  categoryBadge: { label: string; kind: CategoryBadgeKind };
  title: string;
  subtitle: string;
  scopeLabel: string;
  plusOnly: boolean;
  validUntil: string;
  maxSavings: number;
  tabs: OfferTabId[];
  details?: string;
};

const THEMES = [
  {
    stubColor: "#2563EB",
    stubLabel: "BEST OFFER",
    categoryBadge: { label: "Best Seller", kind: "flame" as const },
    tabs: ["all", "best"] as OfferTabId[],
  },
  {
    stubColor: "#10B981",
    stubLabel: "FIRST ORDER",
    categoryBadge: { label: "First Order Offer", kind: "first" as const },
    tabs: ["all", "first"] as OfferTabId[],
  },
  {
    stubColor: "#8B5CF6",
    stubLabel: "AC SPECIAL",
    categoryBadge: { label: "AC Services", kind: "ac" as const },
    tabs: ["all", "seasonal"] as OfferTabId[],
  },
  {
    stubColor: "#F59E0B",
    stubLabel: "PLUS MEMBER",
    categoryBadge: { label: "eFixMate Plus", kind: "crown" as const },
    tabs: ["all", "plus"] as OfferTabId[],
  },
];

export const DEMO_OFFERS: OfferCoupon[] = [
  {
    id: "demo-efix20",
    code: "EFIX20",
    stubLabel: "BEST OFFER",
    stubColor: "#2563EB",
    categoryBadge: { label: "Best Seller", kind: "flame" },
    title: "Flat 20% OFF",
    subtitle: "On orders above ₹999",
    scopeLabel: "All Services",
    plusOnly: false,
    validUntil: "31 Aug 2026",
    maxSavings: 500,
    tabs: ["all", "best"],
    details:
      "Get 20% off on your total bill. Valid on all home services. Maximum discount capped at ₹500.",
  },
  {
    id: "demo-new100",
    code: "NEW100",
    stubLabel: "FIRST ORDER",
    stubColor: "#10B981",
    categoryBadge: { label: "First Order Offer", kind: "first" },
    title: "Flat ₹100 OFF",
    subtitle: "On your first booking",
    scopeLabel: "All Services",
    plusOnly: false,
    validUntil: "31 Dec 2026",
    maxSavings: 100,
    tabs: ["all", "first"],
    details: "One-time use per customer. Applicable on first completed booking only.",
  },
  {
    id: "demo-ac50",
    code: "AC50",
    stubLabel: "AC SPECIAL",
    stubColor: "#8B5CF6",
    categoryBadge: { label: "AC Services", kind: "ac" },
    title: "Flat 50% OFF",
    subtitle: "On all AC repair & service",
    scopeLabel: "AC Services Only",
    plusOnly: false,
    validUntil: "30 Sep 2026",
    maxSavings: 750,
    tabs: ["all", "seasonal"],
    details: "Valid on AC installation, repair, gas refill and maintenance services.",
  },
  {
    id: "demo-plus15",
    code: "PLUS15",
    stubLabel: "PLUS MEMBER",
    stubColor: "#F59E0B",
    categoryBadge: { label: "eFixMate Plus", kind: "crown" },
    title: "Flat 15% OFF",
    subtitle: "Exclusive for Plus Members",
    scopeLabel: "Plus Members Only",
    plusOnly: true,
    validUntil: "31 Mar 2027",
    maxSavings: 300,
    tabs: ["all", "plus"],
    details: "Active eFixMate Plus subscription required. Cannot be combined with other coupons.",
  },
];

function formatValidUntil(raw: unknown): string {
  if (!raw) return "Limited period";
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function discountTitle(
  discountType: string | undefined,
  discountValue: number | undefined
): string {
  const v = Number(discountValue) || 0;
  const t = String(discountType ?? "").toUpperCase();
  if (t.includes("PERCENT")) return `Flat ${v}% OFF`;
  return `Flat ₹${v} OFF`;
}

function inferTabs(code: string, couponType?: string): OfferTabId[] {
  const c = code.toUpperCase();
  const type = String(couponType ?? "").toUpperCase();
  const tabs: OfferTabId[] = ["all"];

  if (
    c.includes("BEST") ||
    c.includes("EFIX") ||
    type.includes("BEST") ||
    type.includes("GENERAL")
  ) {
    tabs.push("best");
  }
  if (
    c.includes("NEW") ||
    c.includes("FIRST") ||
    c.includes("WELCOME") ||
    type.includes("FIRST")
  ) {
    tabs.push("first");
  }
  if (c.includes("AC") || c.includes("SEASON") || type.includes("SEASON")) {
    tabs.push("seasonal");
  }
  if (c.includes("BANK") || c.includes("HDFC") || c.includes("ICICI") || type.includes("BANK")) {
    tabs.push("bank");
  }
  if (c.includes("PLUS") || type.includes("PLUS") || type.includes("MEMBER")) {
    tabs.push("plus");
  }

  if (tabs.length === 1) tabs.push("best");
  return [...new Set(tabs)];
}

function inferStubLabel(code: string, tabs: OfferTabId[]): string {
  const c = code.toUpperCase();
  if (tabs.includes("plus") || c.includes("PLUS")) return "PLUS MEMBER";
  if (tabs.includes("first") || c.includes("NEW") || c.includes("FIRST")) return "FIRST ORDER";
  if (c.includes("AC")) return "AC SPECIAL";
  if (tabs.includes("bank")) return "BANK OFFER";
  if (tabs.includes("seasonal")) return "SEASONAL";
  return "BEST OFFER";
}

function inferScope(
  code: string,
  tabs: OfferTabId[]
): { scopeLabel: string; plusOnly: boolean; categoryKind: CategoryBadgeKind; categoryLabel: string } {
  if (tabs.includes("plus") || code.toUpperCase().includes("PLUS")) {
    return {
      scopeLabel: "Plus Members Only",
      plusOnly: true,
      categoryKind: "crown",
      categoryLabel: "eFixMate Plus",
    };
  }
  if (code.toUpperCase().includes("AC")) {
    return {
      scopeLabel: "AC Services Only",
      plusOnly: false,
      categoryKind: "ac",
      categoryLabel: "AC Services",
    };
  }
  if (tabs.includes("first")) {
    return {
      scopeLabel: "All Services",
      plusOnly: false,
      categoryKind: "first",
      categoryLabel: "First Order Offer",
    };
  }
  if (tabs.includes("bank")) {
    return {
      scopeLabel: "Selected bank cards",
      plusOnly: false,
      categoryKind: "tag",
      categoryLabel: "Bank Offer",
    };
  }
  if (tabs.includes("seasonal")) {
    return {
      scopeLabel: "Seasonal services",
      plusOnly: false,
      categoryKind: "tag",
      categoryLabel: "Seasonal Offer",
    };
  }
  return {
    scopeLabel: "All Services",
    plusOnly: false,
    categoryKind: "flame",
    categoryLabel: "Best Seller",
  };
}

export function parseApiCoupons(raw: unknown): OfferCoupon[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const rows = Array.isArray(o.data) ? o.data : [];

  return rows
    .map((row, index): OfferCoupon | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const code = String(r.coupon_code ?? r.code ?? "")
        .trim()
        .toUpperCase();
      if (!code) return null;

      const theme = THEMES[index % THEMES.length];
      const tabs = inferTabs(code, r.coupon_type ? String(r.coupon_type) : undefined);
      const scope = inferScope(code, tabs);
      const minOrder = Number(r.min_order_amount) || 0;
      const maxSavings =
        Number(r.max_discount_amount) ||
        (String(r.discount_type ?? "").toUpperCase().includes("PERCENT")
          ? 500
          : Number(r.discount_value) || 100);

      return {
        id: String(r.coupon_id ?? code),
        code,
        stubLabel: inferStubLabel(code, tabs),
        stubColor: theme.stubColor,
        categoryBadge: {
          label: scope.categoryLabel,
          kind: scope.categoryKind,
        },
        title: discountTitle(
          r.discount_type ? String(r.discount_type) : undefined,
          Number(r.discount_value)
        ),
        subtitle: minOrder > 0 ? `On orders above ₹${minOrder}` : "On eligible bookings",
        scopeLabel: scope.scopeLabel,
        plusOnly: scope.plusOnly,
        validUntil: formatValidUntil(r.valid_until),
        maxSavings,
        tabs,
        details: `Use code ${code} at checkout. ${minOrder > 0 ? `Minimum order ₹${minOrder}. ` : ""}Maximum savings up to ₹${maxSavings}.`,
      };
    })
    .filter((c): c is OfferCoupon => c != null);
}

export function filterByTab(coupons: OfferCoupon[], tab: OfferTabId): OfferCoupon[] {
  if (tab === "all") return coupons;
  return coupons.filter((c) => c.tabs.includes(tab));
}
