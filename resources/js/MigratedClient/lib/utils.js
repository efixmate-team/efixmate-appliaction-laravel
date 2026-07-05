/**
 * Utility to conditionally join class names
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
