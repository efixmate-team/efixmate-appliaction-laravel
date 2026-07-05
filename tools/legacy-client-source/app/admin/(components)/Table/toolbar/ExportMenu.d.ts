import type { ExportColumn } from "@/app/admin/(lib)/tableExport";

export function ExportMenu(props: {
  columns?: ExportColumn[];
  data?: Record<string, unknown>[];
  fileName?: string;
  title?: string;
  page?: number;
  limit?: number;
  disabled?: boolean;
}): JSX.Element;
