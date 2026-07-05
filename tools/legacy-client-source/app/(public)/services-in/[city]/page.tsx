import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import {
  areasForCity,
  fetchSitemapData,
  findCityBySlug,
  type SeoService,
} from "@/lib/seoData";

export const revalidate = 86400;
export const dynamicParams = true;

type Params = { city: string };

export async function generateStaticParams() {
  const data = await fetchSitemapData();
  return data.cities.map((city) => ({ city: city.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { city: citySlug } = await params;
  const data = await fetchSitemapData();
  const city = findCityBySlug(data, citySlug);

  if (!city) {
    return { title: "Services by City | eFixMate" };
  }

  const title = `Home Services in ${city.city_name} | eFixMate`;
  const description = `Book verified electricians, plumbers, AC technicians, cleaners, and appliance repair experts in ${city.city_name}. Upfront pricing and warranty-backed work.`;

  return {
    title,
    description,
    alternates: { canonical: `https://efixmate.com/services-in/${citySlug}` },
    openGraph: {
      title,
      description,
      url: `https://efixmate.com/services-in/${citySlug}`,
      type: "website",
    },
  };
}

function groupServices(services: SeoService[]) {
  return services.reduce<Record<string, SeoService[]>>((acc, service) => {
    const key = service.category_name || "Home Services";
    acc[key] = acc[key] || [];
    acc[key].push(service);
    return acc;
  }, {});
}

function buildJsonLd(cityName: string, citySlug: string, services: SeoService[]) {
  const base = "https://efixmate.com";
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Home Services in ${cityName}`,
    url: `${base}/services-in/${citySlug}`,
    description: `City-wise eFixMate service directory for ${cityName}.`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: services.slice(0, 30).map((service, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${service.service_name} in ${cityName}`,
        url: `${base}/${citySlug}/${service.slug}`,
      })),
    },
  };
}

export default async function ServicesByCityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city: citySlug } = await params;
  const data = await fetchSitemapData();
  const city = findCityBySlug(data, citySlug);

  if (!city) notFound();

  const cityAreas = areasForCity(data, city.city_id);
  const services = data.services;
  const grouped = groupServices(services);
  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <PublicPageShell
      className="min-h-screen bg-[#f8fafc] text-[#0f172a]"
      header={{ activePath: "/services-in", cta: { label: "All cities", href: "/services-in" } }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(city.city_name, citySlug, data.services)) }}
      />

      <nav aria-label="breadcrumb" className="border-b border-[#e2e8f0] bg-[#ffffff]">
        <ol className="mx-auto flex w-[90%] max-w-6xl flex-wrap items-center gap-1.5 py-2.5 text-[12px] text-[#64748b]">
          <li><Link href="/" className="hover:text-[#0e55d9]">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/services" className="hover:text-[#0e55d9]">Services</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/services-in" className="hover:text-[#0e55d9]">Services by city</Link></li>
          <li aria-hidden>/</li>
          <li className="font-semibold text-[#0f172a]">{city.city_name}</li>
        </ol>
      </nav>

      <section className="border-b border-[#dbeafe] bg-[#eef4ff]">
        <div className="mx-auto grid w-[90%] max-w-6xl gap-8 py-12 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ffffff] px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#0e55d9]">
              <MapPin size={14} /> {city.city_name}
            </p>
            <h1 className="text-[34px] font-black leading-tight lg:text-[48px]">
              Home services in {city.city_name}
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#374151]">
              Book verified technicians for electrical, plumbing, AC, cleaning, appliance repair, carpentry, painting, and more.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffffff] px-3 py-1.5 text-[12px] font-semibold text-[#374151]">
                <BadgeCheck size={14} className="text-[#059669]" /> Verified technicians
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffffff] px-3 py-1.5 text-[12px] font-semibold text-[#374151]">
                <ShieldCheck size={14} className="text-[#059669]" /> Warranty-backed work
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#bfdbfe] bg-[#ffffff] p-5 shadow-sm">
            <p className="text-[12px] font-black uppercase tracking-widest text-[#64748b]">Available now</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[30px] font-black">{services.length}</p>
                <p className="text-[12px] font-semibold text-[#64748b]">Services</p>
              </div>
              <div>
                <p className="text-[30px] font-black">{cityAreas.length}</p>
                <p className="text-[12px] font-semibold text-[#64748b]">Localities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-[90%] max-w-6xl py-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[24px] font-black">Services available in {city.city_name}</h2>
            <p className="mt-1 text-[14px] text-[#64748b]">Choose a service to view pricing, warranty, and booking slots.</p>
          </div>
          <Link href="/services" className="text-[13px] font-black text-[#0e55d9] hover:underline">
            Browse catalog
          </Link>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category}>
              <h3 className="mb-3 text-[15px] font-black uppercase tracking-wide text-[#53697e]">{category}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[category].map((service) => {
                  const title = service.service_name;

                  return (
                    <Link
                      key={service.service_id}
                      href={`/${citySlug}/${service.slug}`}
                      className="group overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm transition hover:border-[#0e55d9]/40 hover:shadow-md"
                    >
                      <div className="flex min-h-[132px] gap-4 p-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                          <Wrench size={26} className="text-[#94a3b8]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-black leading-snug">{title}</p>
                          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#64748b]">
                            Professional {title} in {city.city_name} by verified eFixMate technicians.
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-[12px] font-bold text-[#0e55d9]">
                              View details
                            </span>
                            <ArrowRight size={15} className="text-[#0e55d9] transition group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      {cityAreas.length > 0 && (
        <section className="border-t border-[#e2e8f0] bg-[#ffffff]">
          <div className="mx-auto w-[90%] max-w-6xl py-10">
            <h2 className="text-[22px] font-black">Localities covered in {city.city_name}</h2>
            <p className="mt-1 text-[14px] text-[#64748b]">These localities are covered by eFixMate in this city.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {cityAreas.map((area) => (
                <span
                  key={area.area_id}
                  className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-[13px] font-semibold text-[#374151]"
                >
                  {area.area_name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#0e55d9]">
        <div className="mx-auto flex w-[90%] max-w-6xl flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[24px] font-black text-[#ffffff]">Need help choosing a service?</h2>
            <p className="mt-1 text-[14px] text-[#bfdbfe]">Tell us the issue and we will guide you to the right technician.</p>
          </div>
          <Link href="/contact-us" className="rounded-xl bg-[#ffffff] px-6 py-3 text-[14px] font-black text-[#0e55d9] shadow-sm transition hover:bg-[#eff6ff]">
            Contact support
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
