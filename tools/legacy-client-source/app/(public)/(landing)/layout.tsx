import { ToastProvider } from "@/providers/ToastProvider";
import { LandingChromeProvider } from "./_components/LandingChromeProvider";
import { fetchCmsGlobals, extractChromeFromGlobals } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const globalSections = await fetchCmsGlobals();
  const chrome = extractChromeFromGlobals(globalSections);

  return (
    <ToastProvider>
      <LandingChromeProvider value={chrome}>{children}</LandingChromeProvider>
    </ToastProvider>
  );
}
