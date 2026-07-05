"use client";

export default function Card({ showMe = true, title, subtitle, badge, children }) {
    return (
        <>
            {showMe && <div className="flex flex-col w-full bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden font-sans">

                {/* HEADER */}
                {(title || badge || subtitle) && (
                    <div className="px-6 py-5 border-b border-[#f1f5f9]">
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
                        {subtitle && (
                            <p className="text-xs text-[#53697e]0">{subtitle}</p>
                        )}
                    </div>
                )}

                {/* CONTENT */}
                <div className="p-6">
                    {children}
                </div>

            </div>}
        </>

    );
}