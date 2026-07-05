import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicPageShell } from "@/components/PublicPageShell";
import {
  fetchSitemapData,
  fetchServiceDetail,
  findCityBySlug,
  findServiceBySlug,
  areasForCity,
  relatedServices,
  type SeoCity,
  type SeoService,
  type ServiceDetail,
} from "@/lib/seoData";
import { DEFAULT_PHONE, DEFAULT_EMAIL } from "@/lib/siteDefaults";

async function fetchContactInfo() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    const res = await fetch(`${base}/public/cms/globals`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = await res.json() as { data?: { sections?: Array<{ section_key: string; content: unknown }> } };
    const sections = json?.data?.sections ?? [];
    return sections.find((s) => s.section_key === "global.contact_info")?.content as Record<string, string> | undefined;
  } catch { return null; }
}

export const revalidate = 86400;   // regenerate daily
export const dynamicParams = true; // serve unlisted combos on-demand

// ── Static params (pre-generate all city × service combos) ──────────────────
export async function generateStaticParams() {
  const data = await fetchSitemapData();
  const params: { slug: string; service: string }[] = [];
  for (const city of data.cities) {
    for (const svc of data.services) {
      params.push({ slug: city.slug, service: svc.slug });
    }
  }
  return params;
}

// ── Metadata ─────────────────────────────────────────────────────────────────
type Params = { slug: string; service: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug: citySlug, service: serviceSlug } = await params;
  const data = await fetchSitemapData();
  const city = findCityBySlug(data, citySlug);
  const svc  = findServiceBySlug(data, serviceSlug);

  if (!city || !svc) return { title: "eFixMate" };

  const detail  = await fetchServiceDetail(svc.service_id);
  const name    = detail?.title ?? detail?.service ?? svc.service_name;
  const price   = detail?.price ?? detail?.base_price;
  const title   = `${name} in ${city.city_name} | eFixMate`;
  const description =
    detail?.description ??
    `Book professional ${name} in ${city.city_name}. Verified technicians, transparent pricing, 30-day warranty.${price ? ` Starting ₹${price}.` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: `https://efixmate.com/${citySlug}/${serviceSlug}` },
    openGraph: {
      title,
      description,
      url: `https://efixmate.com/${citySlug}/${serviceSlug}`,
      type: "website",
      ...(detail?.image_url ? { images: [{ url: detail.image_url }] } : {}),
    },
  };
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────
function buildJsonLd(
  city: SeoCity,
  svc: SeoService,
  detail: ServiceDetail | null,
  citySlug: string,
  serviceSlug: string,
  contactPhone: string,
  contactEmail: string,
) {
  const name  = detail?.title ?? detail?.service ?? svc.service_name;
  const price = detail?.price ?? detail?.base_price;
  const BASE  = "https://efixmate.com";

  const faqs = [
    {
      q: `How much does ${name} cost in ${city.city_name}?`,
      a: price
        ? `${name} in ${city.city_name} starts from ₹${price}. Final price depends on the scope of work. eFixMate provides upfront pricing before you confirm.`
        : `eFixMate provides upfront pricing for ${name} in ${city.city_name} before you confirm the booking.`,
    },
    {
      q: `Are eFixMate technicians verified in ${city.city_name}?`,
      a: `Yes. All eFixMate technicians in ${city.city_name} undergo background verification and skill assessment before onboarding.`,
    },
    {
      q: `How quickly can I get ${name} in ${city.city_name}?`,
      a: `eFixMate offers same-day and next-day slots for ${name} in ${city.city_name}, subject to technician availability in your area.`,
    },
    {
      q: `Is there a warranty on ${name} in ${city.city_name}?`,
      a: `Yes. eFixMate provides a 30-day service warranty on ${name} booked through the platform.`,
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${BASE}/#organization`,
        name: "eFixMate",
        url: BASE,
        telephone: contactPhone.replace(/\s/g, "").replace("+", "+"),
        email: contactEmail,
        priceRange: "₹₹",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Near DM Tower, Kailash Nagar, Birgaon",
          addressLocality: "Raipur",
          addressRegion: "Chhattisgarh",
          postalCode: "490013",
          addressCountry: "IN",
        },
        areaServed: { "@type": "AdministrativeArea", name: `${city.city_name}, India` },
      },
      {
        "@type": "Service",
        "@id": `${BASE}/${citySlug}/${serviceSlug}#service`,
        name: `${name} in ${city.city_name}`,
        description: detail?.description ?? `Professional ${name} in ${city.city_name} by verified eFixMate technicians.`,
        url: `${BASE}/${citySlug}/${serviceSlug}`,
        provider: { "@id": `${BASE}/#organization` },
        areaServed: { "@type": "City", name: city.city_name },
        serviceType: svc.category_name ?? name,
        ...(price && {
          offers: {
            "@type": "Offer",
            price: price.toFixed(2),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }),
        ...(detail?.rating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: detail.rating.toFixed(1),
            reviewCount: detail.rating_count ?? 1,
            bestRating: "5",
            worstRating: "1",
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home",           item: BASE },
          { "@type": "ListItem", position: 2, name: "Services",       item: `${BASE}/services` },
          { "@type": "ListItem", position: 3, name: city.city_name,   item: `${BASE}/services-in/${citySlug}` },
          { "@type": "ListItem", position: 4, name,                   item: `${BASE}/${citySlug}/${serviceSlug}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CityServicePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug: citySlug, service: serviceSlug } = await params;
  const data   = await fetchSitemapData();
  const city   = findCityBySlug(data, citySlug);
  const svc    = findServiceBySlug(data, serviceSlug);

  if (!city || !svc) notFound();

  const [detail, cityAreas, ci] = await Promise.all([
    fetchServiceDetail(svc.service_id),
    Promise.resolve(areasForCity(data, city.city_id)),
    fetchContactInfo(),
  ]);

  const contactPhone = ci?.phone ?? DEFAULT_PHONE;
  const contactEmail = ci?.email ?? DEFAULT_EMAIL;

  const related  = relatedServices(data, svc);
  const name     = detail?.title ?? detail?.service ?? svc.service_name;
  const price    = detail?.price ?? detail?.base_price;
  const category = detail?.category_name ?? svc.category_name;

  const TRUST = [
    { icon: "✓", label: "Background-verified technicians" },
    { icon: "✓", label: "Upfront pricing, no hidden charges" },
    { icon: "✓", label: "30-day service warranty" },
    { icon: "✓", label: "On-time or we reschedule free" },
  ];

  const STEPS = [
    { n: "1", title: "Book online", body: "Choose your slot and confirm in under 2 minutes." },
    { n: "2", title: "Get confirmed", body: "A verified technician is assigned to your booking." },
    { n: "3", title: "Technician arrives", body: "On-time at your location, fully equipped." },
    { n: "4", title: "Job done & rated", body: "Pay after the job. Rate your experience." },
  ];

  const faqs = [
    {
      q: `How much does ${name} cost in ${city.city_name}?`,
      a: price
        ? `${name} in ${city.city_name} starts from ₹${price}. eFixMate shows the full price before you confirm — no surprises.`
        : `eFixMate provides upfront pricing for ${name} in ${city.city_name} before you confirm.`,
    },
    {
      q: `Are eFixMate technicians verified in ${city.city_name}?`,
      a: `Yes. Every technician goes through background verification and skill testing before joining eFixMate.`,
    },
    {
      q: `How quickly can I book ${name} in ${city.city_name}?`,
      a: `Same-day and next-day slots are available in most areas of ${city.city_name}. Book in under 2 minutes.`,
    },
    {
      q: `Is there a warranty on ${name}?`,
      a: `Yes — eFixMate provides a 30-day service warranty on every completed booking.`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd(city, svc, detail, citySlug, serviceSlug, contactPhone, contactEmail)),
        }}
      />

      <PublicPageShell
        className="min-h-screen bg-[#ffffff] text-[#0f172a]"
        header={{ activePath: "/services", cta: { label: "Book Now", href: `/service/${svc!.service_id}` } }}
      >

        {/* ── Header ── */}

        {/* ── Breadcrumb ── */}
        <nav aria-label="breadcrumb" className="border-b border-[#f1f5f9] bg-[#f8fafc]">
          <ol className="mx-auto flex w-[90%] max-w-6xl items-center gap-1.5 py-2.5 text-[12px] text-[#64748b] flex-wrap">
            <li><Link href="/" className="hover:text-[#0e55d9]">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/services" className="hover:text-[#0e55d9]">Services</Link></li>
            <li aria-hidden>/</li>
            <li><span className="text-[#94a3b8]">{city.city_name}</span></li>
            <li aria-hidden>/</li>
            <li className="font-medium text-[#0f172a]">{name}</li>
          </ol>
        </nav>

        {/* ── Hero ── */}
        <section className="bg-gradient-to-br from-[#eef4ff] to-[#f0f9ff] py-14 lg:py-20">
          <div className="mx-auto w-[90%] max-w-6xl">
            {category && (
              <p className="mb-3 text-[12px] font-black uppercase tracking-widest text-[#0e55d9]">
                {category}
              </p>
            )}
            <h1 className="text-[32px] font-black leading-tight text-[#0f172a] lg:text-[48px]">
              {name} in {city.city_name}
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#374151]">
              {detail?.description ??
                `Professional ${name} by background-verified technicians. Transparent pricing, 30-day warranty, on-time guaranteed.`}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/service/${svc!.service_id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0e55d9] px-6 py-3.5 text-[14px] font-black text-white shadow-[0_8px_24px_rgba(14,85,217,0.28)] hover:bg-[#0b44b0] transition-colors">
                Book {name}
                {price && <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[12px]">from ₹{price}</span>}
              </Link>
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0e55d9] px-6 py-3.5 text-[14px] font-black text-[#0e55d9] hover:bg-[#eef4ff] transition-colors">
                Call Us
              </a>
            </div>

            {/* Trust pills */}
            <div className="mt-8 flex flex-wrap gap-3">
              {TRUST.map((t) => (
                <span key={t.label} className="flex items-center gap-1.5 rounded-full bg-white border border-[#e2e8f0] px-3 py-1.5 text-[12px] font-semibold text-[#374151] shadow-sm">
                  <span className="text-[#059669]">{t.icon}</span> {t.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-14 border-b border-[#f1f5f9]">
          <div className="mx-auto w-[90%] max-w-6xl">
            <h2 className="text-[22px] font-black text-[#0f172a] mb-8">How it works</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#eef4ff] text-[14px] font-black text-[#0e55d9]">
                    {s.n}
                  </div>
                  <h3 className="text-[14px] font-bold text-[#0f172a]">{s.title}</h3>
                  <p className="mt-1 text-[13px] text-[#64748b]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Service areas in this city ── */}
        {cityAreas.length > 0 && (
          <section className="py-14 border-b border-[#f1f5f9]">
            <div className="mx-auto w-[90%] max-w-6xl">
              <h2 className="text-[22px] font-black text-[#0f172a] mb-2">
                {name} near you in {city.city_name}
              </h2>
              <p className="mb-6 text-[14px] text-[#64748b]">
                We cover {cityAreas.length} area{cityAreas.length !== 1 ? "s" : ""} in {city.city_name}.
                Select your locality for a more specific booking.
              </p>
              <div className="flex flex-wrap gap-2">
                {cityAreas.map((area) => (
                  <Link
                    key={area.area_id}
                    href={`/${citySlug}/${area.slug}/${serviceSlug}`}
                    className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-semibold text-[#0e55d9] hover:border-[#0e55d9] hover:bg-[#eef4ff] transition-colors shadow-sm">
                    {name} in {area.area_name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Related services ── */}
        {related.length > 0 && (
          <section className="py-14 border-b border-[#f1f5f9]">
            <div className="mx-auto w-[90%] max-w-6xl">
              <h2 className="text-[22px] font-black text-[#0f172a] mb-6">
                Other {category ?? "services"} in {city.city_name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link
                    key={r.service_id}
                    href={`/${citySlug}/${r.slug}`}
                    className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-semibold text-[#374151] hover:border-[#0e55d9] hover:text-[#0e55d9] transition-colors shadow-sm">
                    {r.service_name} in {city.city_name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        <section className="py-14 border-b border-[#f1f5f9]">
          <div className="mx-auto w-[90%] max-w-6xl">
            <h2 className="text-[22px] font-black text-[#0f172a] mb-8">
              Frequently asked questions
            </h2>
            <div className="divide-y divide-[#f1f5f9]">
              {faqs.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                    <span className="text-[15px] font-semibold text-[#0f172a]">{q}</span>
                    <span className="shrink-0 text-[#0e55d9] text-[20px] leading-none group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#374151]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="bg-[#0e55d9] py-16">
          <div className="mx-auto w-[90%] max-w-6xl text-center">
            <h2 className="text-[28px] font-black text-white lg:text-[36px]">
              Ready to book {name} in {city.city_name}?
            </h2>
            <p className="mt-3 text-[15px] text-[#bfdbfe]">
              Verified technicians · Transparent pricing · 30-day warranty
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link
                href={`/service/${svc!.service_id}`}
                className="rounded-xl bg-white px-8 py-4 text-[15px] font-black text-[#0e55d9] shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:bg-[#f0f4ff] transition-colors">
                Book Now{price ? ` · from ₹${price}` : ""}
              </Link>
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="rounded-xl border-2 border-white/40 px-8 py-4 text-[15px] font-black text-white hover:bg-white/10 transition-colors">
                {contactPhone}
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        {false && <footer className="border-t border-[#e2e8f0] bg-[#f8fafc] py-8">
          <div className="mx-auto w-[90%] max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#94a3b8]">
            <div className="flex items-center gap-2">
              <BrandLogo width={20} height={20} className="h-5 w-5" />
              <span>© {new Date().getFullYear()} eFixMate. All rights reserved.</span>
            </div>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-[#0e55d9]">Privacy</Link>
              <Link href="/terms-and-conditions" className="hover:text-[#0e55d9]">Terms</Link>
              <Link href="/contact-us" className="hover:text-[#0e55d9]">Contact</Link>
            </div>
          </div>
        </footer>}

      </PublicPageShell>
    </>
  );
}
