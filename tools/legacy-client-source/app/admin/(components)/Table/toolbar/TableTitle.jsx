"use client";

/**
 * TableTitle
 * Title block rendered in the toolbar area.
 *
 * @prop {string} [title]
 * @prop {string} [subtitle]
 * @prop {string} [badge]    - Short uppercase label shown in a pill next to the title
 */
export function TableTitle({ title, subtitle, badge }) {
  if (!title && !subtitle && !badge) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {title && (
          <h2 className="text-lg font-bold text-[#0f172a] ">{title}</h2>
        )}
        {badge && (
          <span className="px-2 py-0.5 bg-[#f1f5f9] text-[#475569] text-[8px] font-bold uppercase tracking-wider rounded-xl border border-[#e2e8f0]">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-[#53697e]0">{subtitle}</p>}
    </div>
  );
}
