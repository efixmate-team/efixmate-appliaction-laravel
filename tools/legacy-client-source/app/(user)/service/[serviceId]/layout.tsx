import type { Metadata } from "next";

const BASE_URL = "https://efixmate.com";

// ── server-side API base (Docker internal or localhost) ──────────────────────
function apiBase(): string {
  const raw =
    process.env.INTERNAL_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:5000";
  if (raw.startsWith("/")) return "http://localhost:5000";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

type ServiceDetail = {
  service_id: number;
  service?: string;
  title?: string;
  description?: string;
  base_price?: number;
  price?: number;
  rating?: number;
  rating_count?: number;
  category_name?: string;
  duration_minutes?: number;
  image_url?: string | null;
  service_icon?: string | null;
};

async function fetchServiceDetail(serviceId: string): Promise<ServiceDetail | null> {
  try {
    const res = await fetch(`${apiBase()}/user/services/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: Number(serviceId) }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json() as { status: boolean; data?: ServiceDetail; result?: ServiceDetail };
    return json.data ?? json.result ?? null;
  } catch {
    return null;
  }
}

// ── Metadata ─────────────────────────────────────────────────────────────────
type Params = { serviceId: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { serviceId } = await params;
  const svc = await fetchServiceDetail(serviceId);
  const name = svc?.title ?? svc?.service ?? "Home Service";
  const price = svc?.price ?? svc?.base_price;
  const category = svc?.category_name;

  const title = category
    ? `${name} | ${category} | eFixMate`
    : `${name} | eFixMate`;
  const description =
    svc?.description ??
    `Book ${name} at transparent pricing. Verified technicians, 30-day warranty, same-day availability.${price ? ` Starting ₹${price}.` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/service/${serviceId}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/service/${serviceId}`,
      type: "website",
      ...(svc?.image_url ? { images: [{ url: svc.image_url }] } : {}),
    },
  };
}

// ── JSON-LD builder ──────────────────────────────────────────────────────────

const LOCAL_BUSINESS = {
  "@type": "LocalBusiness",
  "@id": `${BASE_URL}/#organization`,
  name: "eFixMate",
  url: BASE_URL,
  telephone: "+91-6265600414",
  email: "support@efixmate.com",
  image: `${BASE_URL}/logo.png`,
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Near DM Tower, Kailash Nagar, Birgaon",
    addressLocality: "Raipur",
    addressRegion: "Chhattisgarh",
    postalCode: "490013",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 21.2514,
    longitude: 81.6296,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "08:00",
    closes: "20:00",
  },
  areaServed: { "@type": "AdministrativeArea", name: "Raipur, Chhattisgarh, India" },
};

function buildServiceSchema(svc: ServiceDetail): object {
  const name = svc.title ?? svc.service ?? "Home Service";
  const price = svc.price ?? svc.base_price;

  return {
    "@context": "https://schema.org",
    "@graph": [
      LOCAL_BUSINESS,
      {
        "@type": "Service",
        "@id": `${BASE_URL}/service/${svc.service_id}#service`,
        name,
        description:
          svc.description ??
          `Professional ${name} by verified eFixMate technicians. Transparent pricing, 30-day warranty.`,
        url: `${BASE_URL}/service/${svc.service_id}`,
        provider: { "@id": `${BASE_URL}/#organization` },
        areaServed: { "@type": "AdministrativeArea", name: "Raipur, Chhattisgarh, India" },
        serviceType: svc.category_name ?? name,
        ...(price && {
          offers: {
            "@type": "Offer",
            price: price.toFixed(2),
            priceCurrency: "INR",
            priceSpecification: {
              "@type": "PriceSpecification",
              price: price.toFixed(2),
              priceCurrency: "INR",
              valueAddedTaxIncluded: false,
            },
            availability: "https://schema.org/InStock",
            url: `${BASE_URL}/service/${svc.service_id}`,
          },
        }),
        ...(svc.rating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: svc.rating.toFixed(1),
            reviewCount: svc.rating_count ?? 1,
            bestRating: "5",
            worstRating: "1",
          },
        }),
        ...(svc.duration_minutes && {
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            opens: "08:00",
            closes: "20:00",
          },
        }),
        ...(svc.image_url && { image: svc.image_url }),
      },
    ],
  };
}

// ── Layout ───────────────────────────────────────────────────────────────────
export default async function ServiceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { serviceId } = await params;
  const svc = await fetchServiceDetail(serviceId);

  return (
    <>
      {svc && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildServiceSchema(svc)) }}
        />
      )}
      {children}
    </>
  );
}
