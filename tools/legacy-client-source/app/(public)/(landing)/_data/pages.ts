/** @format */

export type LandingPageData = {
  eyebrow: string;
  title: string;
  summary: string;
  points: string[];
  ctaLabel?: string;
};

export const landingPages: Record<string, LandingPageData> = {
  services: {
    eyebrow: "Services",
    title: "Electrical service support for homes, offices & workplaces",
    summary:
      "Choose from reliable installation, repair, and maintenance services handled by verified eFixMate technicians.",
    points: [
      "Electrical installations for switches, sockets, MCBs, and fixtures.",
      "Fan, light, and appliance support with transparent pricing.",
      "Easy booking, technician assignment, and service updates.",
    ],
    ctaLabel: "Book a Service",
  },
  howItWorks: {
    eyebrow: "How It Works",
    title: "Book, track, and complete your service in four simple steps",
    summary:
      "eFixMate keeps the service journey clear from the moment you choose a service until the job is finished.",
    points: [
      "Select the service and share your preferred schedule.",
      "A verified technician is assigned for your location.",
      "The technician arrives, completes the job, and confirms closure.",
    ],
  },
  about: {
    eyebrow: "About Us",
    title: "Built for dependable services — homes, offices & workplaces",
    summary:
      "eFixMate connects customers with verified technicians for fast, affordable, and transparent service experiences — for homes, offices, workplaces, and annual maintenance contracts.",
    points: [
      "Verified professionals for every assigned job.",
      "Transparent service flow from booking to completion.",
      "Focused on customer trust, punctuality, and support.",
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Need help with a booking or service request?",
    summary:
      "Reach the eFixMate support team for service questions, booking help, technician updates, or account assistance.",
    points: [
      "Phone: +91-6265600414",
      "Email: support@efixmate.com",
      "Address: eFixMate, Near DM Tower, Kailash Nagar, Birgaon, Raipur, CG 490013",
    ],
    ctaLabel: "Call Us Now",
  },
  fanInstallation: {
    eyebrow: "Service",
    title: "Fan Installation",
    summary:
      "Get ceiling, exhaust, and decorative fans installed safely by trained technicians.",
    points: [
      "Support for new fan installation and replacement.",
      "Clean fitting with safety checks before completion.",
      "Convenient appointment slots and clear pricing.",
    ],
  },
  electricalInstallations: {
    eyebrow: "Service",
    title: "Electrical Installations",
    summary:
      "Install switches, sockets, MCBs, fixtures, and other electrical essentials with verified technician support.",
    points: [
      "Safe fitting for common electrical installation needs.",
      "Technician-led inspection before job completion.",
      "Clear booking flow and transparent service handling.",
    ],
  },
  lightInstallation: {
    eyebrow: "Service",
    title: "Light Installation",
    summary:
      "Book installation support for LED lights, tube lights, chandeliers, and decorative lighting.",
    points: [
      "Installation support for indoor and decorative lighting.",
      "Clean setup with basic safety checks.",
      "Convenient scheduling for homes, offices, and shops.",
    ],
  },
  applianceInstallation: {
    eyebrow: "Service",
    title: "Appliance Installation",
    summary:
      "Book installation support for common home appliances with professional handling and setup.",
    points: [
      "Installation support for geysers, water purifiers, chimneys, and more.",
      "Technician-led setup checks for safe use.",
      "Transparent service process from booking to job closure.",
    ],
  },
  electricalRepair: {
    eyebrow: "Service",
    title: "Electrical Repair",
    summary:
      "Resolve wiring issues, short circuits, switches, sockets, and other electrical faults.",
    points: [
      "Fault inspection by verified technicians.",
      "Repair support for wiring, switches, sockets, and MCB issues.",
      "Quick service flow for urgent electrical problems.",
    ],
  },
  amcMaintenance: {
    eyebrow: "Service",
    title: "AMC & Maintenance",
    summary:
      "Plan recurring electrical maintenance for homes, offices, shops, and commercial spaces.",
    points: [
      "Scheduled checks for safer electrical systems.",
      "Suitable for residential and commercial properties.",
      "Helpful for preventive service and ongoing support.",
    ],
  },
};
