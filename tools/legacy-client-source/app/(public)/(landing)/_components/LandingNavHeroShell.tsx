import type { ReactNode } from "react";

/** Wraps landing header + hero so they always fill exactly one viewport height. */
export function LandingNavHeroShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden">
      {children}
    </div>
  );
}

/** Apply to the hero `<section>` (direct child of the shell, after the header). */
export const landingHeroSectionClass =
  "relative flex min-h-0 flex-1 flex-col overflow-hidden";

/** Apply to the primary content grid inside the hero section. */
export const landingHeroInnerClass =
  "relative mx-auto grid h-full min-h-0 w-[90%] max-w-7xl flex-1 items-start gap-6 pt-4 pb-10 sm:gap-8 sm:pt-5 sm:pb-10 lg:gap-10 lg:pt-6 lg:pb-12";
