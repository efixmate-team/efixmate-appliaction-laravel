import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search, Wrench } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { fetchSitemapData } from "@/lib/seoData";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Services by City | eFixMate",
  description: "Find eFixMate home services available in your city. Browse city-wise service pages for verified technicians, upfront pricing, and warranty-backed work.",
  alternates: { canonical: "https://efixmate.com/services-in" },
};

export default async function ServicesByCityIndexPage() {
  const data = await fetchSitemapData();
  const cities = [...data.cities].sort((a, b) => a.city_name.localeCompare(b.city_name));
  const servicesCount = data.services.length;

  return (
    <PublicPageShell
      className="min-h-screen bg-[#f8fafc] text-[#0f172a]"
      header={{ activePath: "/services-in", cta: { label: "All services", href: "/services" } }}
    >
      <section className="border-b border-[#e2e8f0] bg-[#ffffff]">
        <div className="mx-auto grid w-[90%] max-w-6xl gap-8 py-12 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="mb-3 text-[12px] font-black uppercase tracking-widest text-[#0e55d9]">
              Services by city
            </p>
            <h1 className="text-[34px] font-black leading-tight lg:text-[48px]">
              Find home services in your city
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#53697e]">
              Browse eFixMate city pages for electrical, plumbing, AC, cleaning, appliance repair, and more.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div>
              <p className="text-[28px] font-black">{cities.length}</p>
              <p className="text-[12px] font-semibold text-[#64748b]">Cities</p>
            </div>
            <div>
              <p className="text-[28px] font-black">{servicesCount}</p>
              <p className="text-[12px] font-semibold text-[#64748b]">Services</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-[90%] max-w-6xl py-10">
        {cities.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <Link
                key={city.city_id}
                href={`/services-in/${city.slug}`}
                className="group flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm transition hover:border-[#0e55d9]/40 hover:shadow-md"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef4ff] text-[#0e55d9]">
                    <MapPin size={18} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-black">{city.city_name}</span>
                    <span className="text-[12px] text-[#64748b]">{servicesCount} services available</span>
                  </span>
                </span>
                <span className="text-[13px] font-bold text-[#0e55d9] group-hover:translate-x-0.5 transition">
                  View
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-10 text-center">
            <Search className="mx-auto mb-3 text-[#94a3b8]" size={34} />
            <p className="text-[16px] font-black">No city pages available yet</p>
            <p className="mt-1 text-[13px] text-[#64748b]">Add active cities in admin geography to publish city service pages.</p>
          </div>
        )}
      </section>

      <section className="border-t border-[#e2e8f0] bg-[#ffffff]">
        <div className="mx-auto flex w-[90%] max-w-6xl flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#53697e]">
            <Wrench size={16} className="text-[#0e55d9]" />
            Verified technicians, upfront pricing, and warranty-backed service.
          </div>
          <Link href="/services" className="text-[13px] font-black text-[#0e55d9] hover:underline">
            Browse all services
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
