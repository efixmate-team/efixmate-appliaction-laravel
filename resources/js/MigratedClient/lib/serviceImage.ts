/** Service card images from DB `image_url` / `service_icon` (public assets or uploads). */

import { resolveUploadUrl } from "@/lib/api/coreClient";

export const SERVICES_IMAGE_BASE = "/Services";
export const SERVICES_CATEGORY_IMAGE_BASE = "/Services/Categories";
const LEGACY_SERVICES_IMAGE_BASE = "/services-icons/service";
const LEGACY_SERVICES_CATEGORY_IMAGE_BASE = "/services-icons";

/** Legacy PNG files present directly in client/public/Services/. */
export const SERVICE_ICON_KEYS = [
  "AC.webp",
  "AC GAS FILLING.webp",
  "CCTV.webp",
  "DEEP CLEANING.webp",
  "DOOR LOCK.webp",
  "ELECTRIC.webp",
  "FAN INSTALL.webp",
  "FRIDGE REPAIR.webp",
  "GEYSER INSTRALL.webp",
  "MICROWAVE REPAIR.webp",
  "OFFICE ELECTRICAL.webp",
  "PEST CONTROL.webp",
  "PIP LEAKEZ FIX.webp",
  "PLUMBER.webp",
  "SWITCH REPAIR.webp",
  "TILE REPAIR.webp",
  "WALL PUTTY.webp",
  "WASHING MACHINE.webp",
  "WATER PURIFIER.webp",
] as const;

export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number];

export const SERVICE_CATEGORY_IMAGE_FOLDERS: Record<string, readonly string[]> = {
  "Electrical Services": [
    "DOOR BELL INSTALLATION.webp",
    "ELECTRICAL SAFETY  INSPECTION.webp",
    "Electrical wiring  INSTALLATION.webp",
    "EMERGENCY ELECRICIAN VISIT.webp",
    "EXHUST FAN INSTALLATION.webp",
    "FAN INSTALLATION.webp",
    "FAN REPAIR.webp",
    "INVERTER INSTALLATION.webp",
    "LIGHT  INSTALLATION.webp",
    "LIGHT REPAIR.webp",
    "MCB INSTALLATION.webp",
    "MCB REPAIR.webp",
    "OFFICE ELEECTRICAL MAINTNENCE.webp",
    "POWER FAILURE TROUBLESHOOTING.webp",
    "SHORT- CIRCUIT REPAIR.webp",
    "SOCKET INSTALLATION.webp",
    "SWITCH INSTALLATION.webp",
    "SWITCH REPAIR.webp",
    "WIRING REPAIR 2.webp",
    "WIRING REPAIR.webp",
  ],
  "Plumbing Services": [
    "BALL VALVE REPLACEMENT.webp",
    "BASINK INSTALLATION.webp",
    "BATHROOM PLUMBING OVERHUAL.webp",
    "ChatGPT Image Jun 5, 2026, 01_23_50 AM.webp",
    "DRAINAGE CLEANINGUNCLOGGING.webp",
    "EMERGENCY PLUMBER VISIT.webp",
    "KITCHEN PLUMBING SETUP.webp",
    "OVERHEAD TANK CLEANING.webp",
    "PIPE INSTALLATION.webp",
    "PIPE LEAKAGE REPAIR.webp",
    "SEPTIC TANK CLEANING.webp",
    "SUMP PUMP INSTALLATION.webp",
    "TAPFAUCET INSTALLATION.webp",
    "TAPFAUCET RPAIR.webp",
    "TOILET INSTALLATION.webp",
    "TOILET REPAIR.webp",
    "WATER HEATERGEYSER INSTALAATION.webp",
    "WATER HEATERGEYSER REPAIR.webp",
    "WATER METER INSTALLATION.webp",
    "WATER PRESSURE ISSUE FIX.webp",
  ],
  "HVAC & Appliance Services": [
    "AC GAS REFILLING.webp",
    "AC INSTALLATION SPLITWINDOW.webp",
    "AC REPAIR.webp",
    "AC SERVICE CLEANING.webp",
    "AC UNINSTALLATION.webp",
    "AIR COOLER REPAIR.webp",
    "CHIMNEY CLEANING  REPAIR.webp",
    "COMMERCIAL AC MAINTENANCE.webp",
    "DISHWASHER REPAIR.webp",
    "DRYER REPAIR.webp",
    "EXHAUST FAN REPAIR.webp",
    "GEYSER INSTALLATION.webp",
    "GEYSER REPAIR.webp",
    "HVAC DUCT CLEANING.webp",
    "MICROWARE OVER REPAIR.webp",
    "REFRIGERATOR REPAIR.webp",
    "TV WALL MOUNTING.webp",
    "WASHING MACHINE REPAIR.webp",
    "WATER PURIFIER INSTALLATION.webp",
    "WATER PURIFIER SERVICE.webp",
  ],
  "Carpentry & Furniture Services": [
    "BED FRAME ASSEMBLY.webp",
    "CARPENTER CONSULTATION.webp",
    "CHAIR TABLE REPAIR.webp",
    "COSTOM WOODWORK.webp",
    "CURTAIN ROD INSTALLATION.webp",
    "DOOR INSTALLATION.webp",
    "DOOR REPAIR.webp",
    "EMERGENCY CARPENTRY.webp",
    "FALSE CEILING WORK.webp",
    "FURNITURE ASSEMBLY.webp",
    "FURNITURE POLISHING.webp",
    "KITCHEN CABINET INSTALLATION.webp",
    "PATITION WALL  (WOODPVC).webp",
    "PLYWOOD WORK.webp",
    "SHELF RACK INSTALLATION.webp",
    "SOFA REPAIR.webp",
    "TV UNITENTERTAINMENT STAND.webp",
    "WARDROBE INSTALLATION.webp",
    "WINDOW FRAME REPAIR.webp",
    "WOODEN FLOORING INSTALLATION.webp",
  ],
  "Painting Services": [
    "CELLING PAINTING.webp",
    "COLOR CONSULTATION.webp",
    "DISTEMPAR PAINTING.webp",
    "ENAMEL PAINTING.webp",
    "EPOXY FLOOR COATING.webp",
    "EXTERIOR WALL PAINTING.webp",
    "FULL HOME PAINTING 2BHK.webp",
    "FULL HOME PAINTING 3BHK.webp",
    "INTERIOR WALL PAINTING.webp",
    "METAL PAINTINGANTI-RUST.webp",
    "OFFICE PAINTING.webp",
    "POP PUTTY WORK.webp",
    "POST PAINTING CLEANING.webp",
    "ROOF PAINTING.webp",
    "STENCILDESIGN  PAINTING.webp",
    "TEXTURE PAINTING.webp",
    "TOUCH-UP PAINTING.webp",
    "WALLPEPAR INSTALLATION.webp",
    "WATERPROFING.webp",
    "WOOD PAINTING POLISHING.webp",
  ],
  "Cleaning Services": [
    "AC FILTER CLEANING.webp",
    "BALCONY CLEANING.webp",
    "BATROOM DEEP CLEANING.webp",
    "CARPRTRUG CLEANING.webp",
    "DEEP CLEANING (2BHK).webp",
    "DEEP CLEANING (3BHK).webp",
    "DEEP CLEANING.webp",
    "FLOOR SCRUBBING & POLISHING.webp",
    "INDUSTRIAL WAREHOUSE CLEANING.webp",
    "KITCHEN DEEP CLEANING.webp",
    "MARBLE POLISHING.webp",
    "MATTRESS CLEANING.webp",
    "MOVE-INMOVEOUT CLEANING.webp",
    "OFFICE CLEANING.webp",
    "POST-CONSTRUCTION CLEANING.webp",
    "SANITIZATION SERVICE.webp",
    "SOFAUPHOLSTERY CLEANING.webp",
    "TANKSUMP CLEANING.webp",
    "TERRACE CLEANING.webp",
    "WINDOWGLASS CLEANING.webp",
  ],
  "Pest Control Services": [
    "ANT CONTROL.webp",
    "BED BUG TREATMENT.webp",
    "COCKROACH CONTROL 2BHK.webp",
    "COCKROACH CONTROL 3BHK.webp",
    "COCKROACH CONTROL.webp",
    "FLY CONTROL.webp",
    "FUMIGATION  SERVICE.webp",
    "GARDEN PEST CONTROL.webp",
    "GENERAL PEST CONTROL 1BHK.webp",
    "GENERAL PEST CONTROL 2BHK.webp",
    "HONEY BEEWASP REMOVAL.webp",
    "LIZARD CONTROL.webp",
    "MOSQUITODENGUE CONTROL.webp",
    "OFFICE PEST CONTROL.webp",
    "PEST CONTROL.webp",
    "RODENTRAT CONTROL.webp",
    "TERMITE CONTROL (POST-CONSTRUCTION).webp",
    "TERMITE CONTROL.webp",
    "WOOD BORER TREATMENT.webp",
  ],
} as const;

export type ServiceImageOption = {
  key: string;
  label: string;
  url: string;
};

function serviceImagePath(categoryName: string, fileName: string): string {
  return `${LEGACY_SERVICES_IMAGE_BASE}/${categoryName}/${fileName}`;
}

export function getServiceImageOptionsForCategory(categoryName?: string | null): ServiceImageOption[] {
  const name = String(categoryName || "").trim();
  const files = name ? SERVICE_CATEGORY_IMAGE_FOLDERS[name] : null;
  if (!files?.length) {
    return SERVICE_ICON_KEYS.map((key) => ({
      key,
      label: key.replace(/\.(png|webp)$/i, ""),
      url: `${LEGACY_SERVICES_IMAGE_BASE}/${key}`,
    }));
  }
  return files.map((file) => ({
    key: serviceImagePath(name, file),
    label: file.replace(/\.(png|webp)$/i, ""),
    url: serviceImagePath(name, file),
  }));
}

export function isPublicServiceImagePath(path?: string | null): boolean {
  if (!path?.trim()) return false;
  const s = path.trim();
  return (
    s.startsWith(`${SERVICES_IMAGE_BASE}/`) ||
    s.startsWith(`${SERVICES_CATEGORY_IMAGE_BASE}/`) ||
    s.startsWith("Services/") ||
    s.startsWith(`${LEGACY_SERVICES_IMAGE_BASE}/`) ||
    s.startsWith(`${LEGACY_SERVICES_CATEGORY_IMAGE_BASE}/`) ||
    s.startsWith("services-icons/service/") ||
    s.startsWith("services-icons/")
  );
}

/** Resolve DB image path for display in Next.js (static public or API uploads). */
export function resolveServiceImageUrl(path?: string | null): string | null {
  if (!path?.trim()) return null;
  const trimmed = path.trim();

  // Already a correct legacy path — return as-is
  if (trimmed.startsWith(`${LEGACY_SERVICES_IMAGE_BASE}/`)) return trimmed;
  if (trimmed.startsWith(`${LEGACY_SERVICES_CATEGORY_IMAGE_BASE}/`)) return trimmed;
  if (trimmed.startsWith("services-icons/service/")) return `/${trimmed}`;
  if (trimmed.startsWith("services-icons/")) return `/${trimmed}`;

  // /Services/Categories/X.webp → /services-icons/X.webp (check before /Services/)
  if (trimmed.startsWith(`${SERVICES_CATEGORY_IMAGE_BASE}/`)) {
    return `/services-icons/${trimmed.slice(SERVICES_CATEGORY_IMAGE_BASE.length + 1)}`;
  }
  // /Services/X.webp or /Services/Folder/X.webp → /services-icons/service/...
  if (trimmed.startsWith(`${SERVICES_IMAGE_BASE}/`)) {
    return `/services-icons/service/${trimmed.slice(SERVICES_IMAGE_BASE.length + 1)}`;
  }
  // Without leading slash variants
  if (trimmed.startsWith("Services/Categories/")) {
    return `/services-icons/${trimmed.slice("Services/Categories/".length)}`;
  }
  if (trimmed.startsWith("Services/")) {
    return `/services-icons/service/${trimmed.slice("Services/".length)}`;
  }

  // Bare filename (e.g. "DOOR LOCK.webp") → public service icon
  if (/^[A-Za-z0-9 _.-]+\.(png|jpe?g|webp|gif|avif)$/i.test(trimmed)) {
    return `${LEGACY_SERVICES_IMAGE_BASE}/${trimmed}`;
  }

  const uploaded = resolveUploadUrl(trimmed);
  return uploaded || null;
}
