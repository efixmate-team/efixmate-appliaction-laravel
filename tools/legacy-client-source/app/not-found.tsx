import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#eff6ff]">
        <Search size={36} className="text-[#2563eb]" strokeWidth={1.5} />
      </div>
      <h1 className="text-[32px] font-bold text-[#0f172a]">404</h1>
      <p className="mt-2 text-[17px] font-semibold text-[#334155]">Page not found</p>
      <p className="mt-2 max-w-sm text-[13px] text-[#64748b]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
        >
          <Home size={15} />
          Go to Homepage
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#334155] hover:bg-[#f8fafc]"
        >
          Browse Services
        </Link>
      </div>
    </div>
  );
}
