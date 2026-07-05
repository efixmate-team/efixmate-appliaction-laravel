import Image from "next/image";
import { BRAND_LOGO_ALT, BRAND_LOGO_SRC } from "@/src/shared/constants/branding";

type BrandLogoProps = {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  /** Use on dark backgrounds (e.g. footer) — white surface so the logo stays visible */
  variant?: "default" | "onDark";
};

const SIZE_CLASS = /\b(h-|w-|max-h-|max-w-|size-)/;

export function BrandLogo({
  width = 40,
  height = 40,
  className = "",
  priority,
  variant = "default",
}: BrandLogoProps) {
  const size = Math.max(width, height);
  const hasSizeClass = SIZE_CLASS.test(className);
  const shellClass = [
    "inline-flex shrink-0 items-center justify-center overflow-hidden",
    hasSizeClass ? className : "",
  ]
    .filter(Boolean)
    .join(" ");

  const image = (
    <Image
      src={BRAND_LOGO_SRC}
      width={size}
      height={size}
      alt={BRAND_LOGO_ALT}
      className="h-full w-full object-contain"
      priority={priority}
    />
  );

  if (variant === "onDark") {
    return (
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#ffffff] p-1.5 shadow-lg ring-1 ring-[#ffffff]/20">
        {image}
      </span>
    );
  }

  return (
    <span
      className={shellClass || "inline-flex shrink-0 items-center justify-center overflow-hidden"}
      style={hasSizeClass ? undefined : { width: size, height: size }}
    >
      {image}
    </span>
  );
}
