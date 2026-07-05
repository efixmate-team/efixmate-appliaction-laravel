import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SimpleLegalPage } from "../_components/SimpleLegalPage";
import type { SimpleLegalSection } from "../_components/SimpleLegalPage";
import { fetchCmsPage, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await fetchCmsPage(slug);
  const p = page as {
    name?: string;
    meta_title?: string;
    meta_description?: string;
  } | null;

  return {
    title: p?.meta_title ?? (p?.name ? `${p.name} | eFixMate` : "eFixMate"),
    description: p?.meta_description ?? "eFixMate public information page.",
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: p?.meta_title ?? (p?.name ? `${p.name} | eFixMate` : "eFixMate"),
      description: p?.meta_description ?? "eFixMate public information page.",
      url: `/${slug}`,
      type: "article",
    },
  };
}

export default async function CmsSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { page, sections } = await fetchCmsPage(slug);
  if (!page) notFound();

  const p = page as { name?: string; last_updated_at?: string | null };
  const m = toSectionMap(sections);
  const cms = m[`${slug}.content`] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <SimpleLegalPage
      title={cms?.title ?? p.name ?? "eFixMate"}
      lastUpdated={cms?.lastUpdated ?? formatDate(p.last_updated_at)}
      intro={cms?.intro ?? "This page is managed by the eFixMate CMS."}
      sections={cms?.sections?.length ? cms.sections : []}
    />
  );
}

function formatDate(value?: string | null) {
  if (!value) return "June 2026";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "June 2026";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
