import type { Metadata } from "next";
import { LegalPageLayout } from "../../_components/LegalPageLayout";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchPageMeta, toSectionMap } from "@/lib/serverCms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("account-deletion-policy", {
    title: "Account Deletion Policy | eFixMate",
    description:
      "Learn how to delete your eFixMate account, what data is removed, what we retain for legal compliance, and what happens to active bookings during deletion.",
    canonical: "/account-deletion-policy",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Grievance Policy", href: "/grievance-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

const DEFAULT_INTRO =
  "You have the right to delete your eFixMate account and request removal of your personal data, subject to applicable legal and contractual obligations. This policy explains the deletion process, what data is removed, and what we are required to retain.";

const DEFAULT_SECTIONS: SimpleLegalSection[] = [
  {
    title: "1. How to Request Account Deletion",
    paragraphs: [
      "You may request deletion of your eFixMate account through any of the following methods:",
    ],
    bullets: [
      "In-App: Go to Profile → Settings → Account → Delete Account and follow the on-screen steps.",
      "Email: Send a deletion request to support@efixmate.com from your registered email address with the subject line 'Account Deletion Request'.",
      "Support: Contact our customer support team who will guide you through the process.",
    ],
  },
  {
    title: "2. Verification and Processing Time",
    paragraphs: [
      "For security purposes, we will verify your identity before processing a deletion request. Once verified, account deletion is completed within 30 days of the confirmed request.",
      "You will receive a confirmation email when your account has been successfully deleted.",
    ],
  },
  {
    title: "3. What Gets Deleted",
    bullets: [
      "Your profile information (name, phone number, email, profile picture).",
      "Your saved service addresses.",
      "Your active app sessions and device tokens.",
      "Your marketing preferences and push notification subscriptions.",
      "Any pending or unsent notifications.",
    ],
  },
  {
    title: "4. What We Retain and Why",
    paragraphs: [
      "Certain data must be retained even after account deletion to comply with Indian legal and regulatory obligations:",
    ],
    bullets: [
      "Booking records and transaction history: Retained for 7 years for GST compliance and accounting purposes (under the Companies Act 2013 and CGST Act 2017).",
      "Financial records: Retained as required under applicable tax and financial regulations.",
      "Dispute and grievance records: Retained for up to 3 years to support any legal claims or regulatory enquiries.",
      "Legally mandated user data: Retained for the period required by law enforcement or court orders.",
    ],
  },
  {
    title: "5. Effect on Active Bookings",
    paragraphs: [
      "Accounts with pending, confirmed, or in-progress bookings cannot be deleted until those bookings are completed, cancelled, or resolved. Any outstanding payments or refunds must also be settled before account deletion can proceed.",
      "If you have an active Annual Maintenance Contract (AMC), please contact support to discuss options before requesting deletion.",
    ],
  },
  {
    title: "6. Reactivation",
    paragraphs: [
      "Once deleted, your account cannot be reactivated. If you wish to use eFixMate services again in the future, you will need to create a new account. Retained transaction records linked to your phone number may still be visible to you on re-registration for compliance purposes.",
    ],
  },
  {
    title: "7. Contact Us",
    paragraphs: [
      "For questions about account deletion or to exercise your data rights under the DPDP Act 2023, please contact us at support@efixmate.com or raise a grievance with our Grievance Officer at grievance@efixmate.com.",
    ],
  },
];

export default async function AccountDeletionPolicyPage() {
  const { sections } = await fetchCmsPage("account-deletion-policy");
  const m = toSectionMap(sections);
  const cms = m["account-deletion-policy.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;

  return (
    <LegalPageLayout
      title={cms?.title ?? "Account Deletion Policy"}
      description="Learn how to delete your eFixMate account, what data is removed, what we retain for legal compliance, and what happens to active bookings during deletion."
      canonical="/account-deletion-policy"
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : DEFAULT_SECTIONS}
    />
  );
}
