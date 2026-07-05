import type { Metadata } from "next";
import { LegalPageLayout } from "../../_components/LegalPageLayout";
import type { SimpleLegalSection } from "../../_components/SimpleLegalPage";
import { fetchCmsPage, fetchCmsGlobals, fetchPageMeta, toSectionMap } from "@/lib/serverCms";
import { DEFAULT_PHONE } from "@/lib/siteDefaults";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMeta("safety-and-verification", {
    title: "Safety & Verification | eFixMate",
    description:
      "Learn how eFixMate verifies every service technician — KYC, police verification, skill assessment, and identity checks — so you can open your door with confidence.",
    canonical: "/safety-and-verification",
    ogType: "article",
  });
}

const RELATED = [
  { label: "Warranty Policy",  href: "/warranty-policy" },
  { label: "Grievance Policy", href: "/grievance-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

const DEFAULT_INTRO =
  "Inviting a technician into your home requires trust. eFixMate's multi-layer verification process is designed so that every professional who arrives at your door has been identity-checked, background-screened, skill-assessed, and trained on customer safety protocols before their first booking.";

function buildDefaultSections(phone: string): SimpleLegalSection[] {
  return [
  {
    title: "1. Service Partner KYC Verification",
    paragraphs: [
      "Every technician who joins the eFixMate platform must complete a Know Your Customer (KYC) verification before they are activated. This is a mandatory, non-negotiable step and no bookings are assigned to unverified professionals.",
    ],
    bullets: [
      "Government-issued photo ID: Aadhaar Card, PAN Card, Driving Licence, or Passport.",
      "Current address proof: Must match the declared service area.",
      "A clear selfie with the ID document taken at the time of onboarding.",
      "Bank account verification for payout processing — confirms the professional's financial identity.",
      "KYC documents are reviewed by our compliance team within 48–72 hours before the account is activated.",
    ],
  },
  {
    title: "2. Police Verification Process",
    paragraphs: [
      "eFixMate requires a police verification report or character certificate for all service partners before they are permitted to handle home service bookings. This is the most critical layer of our safety programme.",
    ],
    bullets: [
      "Online police verification certificate issued by the respective state police authority, or",
      "Character certificate issued by a local police station not older than 12 months at the time of onboarding.",
      "Technicians without a clean verification record are not onboarded, regardless of their technical skill.",
      "Police verification records are re-checked annually to ensure the information remains current.",
      "For technicians who join via registered partner companies, the partner is contractually responsible for providing equivalent verification.",
    ],
  },
  {
    title: "3. Skill Assessment & Certification",
    paragraphs: [
      "Beyond identity verification, eFixMate assesses every technician's technical competence to ensure the quality of service delivered. Unskilled or uncertified technicians are not assigned to customer bookings.",
    ],
    bullets: [
      "Practical skill test conducted in person or through an authorised training partner.",
      "Minimum experience requirement: 2 years of hands-on experience in the relevant trade category.",
      "Category-specific certification: ITI (Industrial Training Institute), NCVT, or equivalent trade certificate is verified.",
      "New entrants without formal certification undergo a supervised probationary period before independent booking assignment.",
      "Technicians are periodically assessed for quality and rated by customers after every completed booking. Sustained low ratings result in remedial training or deactivation.",
    ],
  },
  {
    title: "4. Customer Safety Guidelines",
    paragraphs: [
      "eFixMate recommends the following safety practices whenever a technician visits your home:",
    ],
    bullets: [
      "Always verify the technician's identity using the eFixMate app before allowing entry — the app shows a photo, name, and masked contact number.",
      "Confirm the booking reference number with the technician on arrival.",
      "Ensure an adult is present at the service address for the duration of the visit.",
      "Do not share OTPs, banking credentials, or passwords with any eFixMate technician — these are never required for service.",
      "Keep valuables and sensitive documents out of the work area.",
      "If you feel unsafe or uncomfortable at any point, end the visit and immediately contact eFixMate support.",
      "Rate and review your technician after each visit — your feedback directly impacts quality standards.",
    ],
  },
  {
    title: "5. Emergency Contact Procedure",
    paragraphs: [
      "If you experience an emergency or safety incident during or after a service visit, contact eFixMate immediately:",
    ],
    bullets: [
      `Emergency Support Line: ${phone} (Monday – Saturday, 8 AM – 8 PM). For after-hours urgent situations, use the in-app SOS feature.`,
      "In-App Report: Open the booking → 'Report an Issue' → 'Safety Concern' to flag an incident directly.",
      "Email: safety@efixmate.com for documented safety complaints.",
      "In the event of an immediate threat to safety or a criminal incident, contact local emergency services (100 for police, 112 for unified emergency) first before reaching out to eFixMate.",
      "All safety complaints are treated with the highest priority and are escalated to our safety team within 1 hour during business hours.",
    ],
  },
  {
    title: "6. Identity Verification Standards",
    paragraphs: [
      "eFixMate's identity verification standards are designed to ensure that the technician who arrives at your address is the same person who completed the verification process.",
    ],
    bullets: [
      "Unique digital profile: Each technician has a verified profile photograph, unique ID, and service category badge visible in the customer app.",
      "Real-time assignment visibility: The eFixMate app shows the technician's name, photo, and live location once a booking is accepted — so you always know who to expect.",
      "Impersonation prevention: Technicians are not permitted to share or transfer their eFixMate login. Using another person's account is a permanent offence resulting in immediate deactivation.",
      "Uniform identification: All active eFixMate technicians carry an official ID card with their photograph, technician ID, and the eFixMate verification seal.",
      "Profile changes (photo, name, phone number) require re-verification before taking effect.",
    ],
  },
];}

export default async function SafetyAndVerificationPage() {
  const [{ sections }, globalSections] = await Promise.all([
    fetchCmsPage("safety-and-verification"),
    fetchCmsGlobals(),
  ]);
  const m = toSectionMap(sections);
  const gm = toSectionMap(globalSections);
  const cms = m["safety-and-verification.content"] as {
    title?: string;
    lastUpdated?: string;
    intro?: string;
    sections?: SimpleLegalSection[];
  } | undefined;
  const ci = gm["global.contact_info"] as Record<string, string> | undefined;
  const phone = ci?.phone ?? DEFAULT_PHONE;

  return (
    <LegalPageLayout
      title={cms?.title ?? "Safety & Verification"}
      description="Learn how eFixMate verifies every service technician — KYC, police verification, skill assessment, and identity checks — so you can open your door with confidence."
      canonical="/safety-and-verification"
      lastUpdated={cms?.lastUpdated ?? "January 2026"}
      intro={cms?.intro ?? DEFAULT_INTRO}
      relatedLinks={RELATED}
      sections={cms?.sections?.length ? cms.sections : buildDefaultSections(phone)}
    />
  );
}
