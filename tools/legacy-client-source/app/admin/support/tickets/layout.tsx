import { Suspense } from "react";
import { TableSkeleton } from "../(components)/TableSkeleton";

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<TableSkeleton />}>{children}</Suspense>;
}
