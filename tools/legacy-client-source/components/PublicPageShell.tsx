import type { ReactNode } from "react";
import { PublicHeader, type PublicHeaderProps } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

export type PublicPageShellProps = {
  children: ReactNode;
  header?: PublicHeaderProps | false;
  footer?: boolean;
  mobileFooterPadding?: boolean;
  className?: string;
};

export function PublicPageShell({
  children,
  header = {},
  footer = true,
  mobileFooterPadding = false,
  className = "min-h-screen bg-[#ffffff] text-[#0f172a]",
}: PublicPageShellProps) {
  return (
    <div className={className}>
      {header !== false && <PublicHeader {...header} />}
      {children}
      {footer && <SiteFooter mobileNav={mobileFooterPadding} />}
    </div>
  );
}
