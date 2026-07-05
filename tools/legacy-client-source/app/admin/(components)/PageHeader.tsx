import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ Icon, iconBg, iconColor, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-[#0f172a]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-[#64748b]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
