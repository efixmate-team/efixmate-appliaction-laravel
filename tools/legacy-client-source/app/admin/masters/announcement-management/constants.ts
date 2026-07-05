export const AUDIENCE_OPTIONS = [
  { id: "USER", label: "User app" },
  { id: "TECHNICIAN", label: "Technician app" },
  { id: "BOTH", label: "Both" },
];

export const USER_SCREENS = [
  { id: "HOME", label: "Home" },
  { id: "SERVICES", label: "Services" },
  { id: "BOOKINGS", label: "Bookings" },
  { id: "OFFERS", label: "Offers" },
  { id: "WALLET", label: "Wallet" },
  { id: "PROFILE", label: "Profile" },
];

export const TECH_SCREENS = [
  { id: "HOME", label: "Home" },
  { id: "JOBS", label: "Jobs" },
  { id: "EARNINGS", label: "Earnings" },
  { id: "SCHEDULE", label: "Schedule" },
  { id: "PROFILE", label: "Profile" },
];

export const BOTH_SCREENS = [
  { id: "HOME", label: "Home" },
  { id: "PROFILE", label: "Profile" },
];

export function getScreenOptions(audience: string) {
  const a = (audience || "USER").toUpperCase();
  if (a === "TECHNICIAN") return TECH_SCREENS;
  if (a === "BOTH") return BOTH_SCREENS;
  return USER_SCREENS;
}
