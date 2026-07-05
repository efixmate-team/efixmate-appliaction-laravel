import type { Metadata } from "next";
import AboutPageView from "./AboutPageView";
import type { AboutPageViewProps } from "./AboutPageView";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("about", {
    title: "About Us | eFixMate",
    description:
      "eFixMate is India's most trusted services marketplace — connecting homes, offices & workplaces with background-verified professionals for electrical, plumbing, AC, cleaning, annual maintenance, and more.",
    canonical: "/about-us",
  });
}

export default async function AboutUsPage() {
  const { sections } = await fetchCmsPage("about");
  const m = toSectionMap(sections);

  const hero   = m["about.hero"]       as Record<string, string>       | undefined;
  const miss   = m["about.mission"]    as Record<string, string>       | undefined;
  const vis    = m["about.vision"]     as Record<string, string>       | undefined;
  const bCta   = m["about.bottom_cta"] as Record<string, string>       | undefined;
  const nav    = m["global.header_nav"] as Array<{ label: string; href: string }> | undefined;

  const cmsStats             = m["about.stats"]                as AboutPageViewProps["cmsStats"]             | undefined;
  const cmsComparison        = m["about.comparison"]           as AboutPageViewProps["cmsComparison"]        | undefined;
  const trustPillars         = m["about.trust_pillars"]        as AboutPageViewProps["trustPillars"]         | undefined;
  const professionalBenefits = m["about.professional_benefits"] as AboutPageViewProps["professionalBenefits"] | undefined;
  const cmsValues            = m["about.values"]               as AboutPageViewProps["cmsValues"]            | undefined;
  const cmsStory             = m["about.story"]                as AboutPageViewProps["cmsStory"]             | undefined;
  const cmsLeadership        = m["about.leadership"]           as AboutPageViewProps["cmsLeadership"]        | undefined;
  const futureVision         = m["about.future_vision"]        as AboutPageViewProps["futureVision"]         | undefined;
  const problemSection       = m["about.problem_section"]      as AboutPageViewProps["problemSection"]       | undefined;

  return (
    <AboutPageView
      heroHeading={hero?.heading}
      heroDescription={hero?.description}
      heroCta={hero?.cta}
      mission={miss ? { heading: miss.heading, body: miss.body } : undefined}
      vision={vis  ? { heading: vis.heading,  body: vis.body  } : undefined}
      bottomCta={bCta ? { heading: bCta.heading, subtext: bCta.subtext, btn_text: bCta.btn_text } : undefined}
      navItems={nav}
      cmsStats={cmsStats}
      cmsComparison={cmsComparison}
      trustPillars={trustPillars}
      professionalBenefits={professionalBenefits}
      cmsValues={cmsValues}
      cmsStory={cmsStory}
      cmsLeadership={cmsLeadership}
      futureVision={futureVision}
      problemSection={problemSection}
    />
  );
}
