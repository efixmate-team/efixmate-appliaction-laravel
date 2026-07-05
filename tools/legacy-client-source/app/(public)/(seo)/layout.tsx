import { ToastProvider } from "@/providers/ToastProvider";
import { LandingChromeProvider } from "@/app/(public)/(landing)/_components/LandingChromeProvider";
import { fetchCmsGlobals, extractChromeFromGlobals } from "@/lib/serverCms";

export default async function SeoLayout({ children }: { children: React.ReactNode }) {
  const globalSections = await fetchCmsGlobals();
  const chrome = extractChromeFromGlobals(globalSections);

  return (
    <ToastProvider>
      <LandingChromeProvider value={chrome}>{children}</LandingChromeProvider>
    </ToastProvider>
  );
}
