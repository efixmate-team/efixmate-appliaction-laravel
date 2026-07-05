import { SimpleLegalPage, type SimpleLegalSection } from "./SimpleLegalPage";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  canonical: string;
  lastUpdated: string;
  intro: string;
  sections: SimpleLegalSection[];
  relatedLinks?: { label: string; href: string }[];
  contactEmail?: string;
}

export function LegalPageLayout({
  title,
  description,
  canonical,
  lastUpdated,
  intro,
  sections,
  relatedLinks,
  contactEmail,
}: LegalPageLayoutProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `https://efixmate.com${canonical}`,
    dateModified: lastUpdated,
    isPartOf: {
      "@type": "WebSite",
      name: "eFixMate",
      url: "https://efixmate.com",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://efixmate.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: `https://efixmate.com${canonical}`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SimpleLegalPage
        title={title}
        lastUpdated={lastUpdated}
        intro={intro}
        sections={sections}
        relatedLinks={relatedLinks}
        contactEmail={contactEmail}
      />
    </>
  );
}
