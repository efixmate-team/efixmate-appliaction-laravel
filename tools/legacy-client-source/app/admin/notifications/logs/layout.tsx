import { Suspense } from "react";
import { LoadingBlock } from "../(components)/LoadingBlock";

export default function LogsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingBlock label="Loading logs…" />}>{children}</Suspense>;
}
