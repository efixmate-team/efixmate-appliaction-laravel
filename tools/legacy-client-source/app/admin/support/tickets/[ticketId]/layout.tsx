import { Suspense } from "react";
import { TableSkeleton } from "../../(components)/TableSkeleton";

export default function TicketDetailLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<TableSkeleton rows={8} />}>{children}</Suspense>;
}
