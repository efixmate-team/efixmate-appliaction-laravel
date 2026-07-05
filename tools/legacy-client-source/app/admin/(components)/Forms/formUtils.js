import {
  Search, Mail, Lock, User, Phone, Calendar, Link, Hash,
} from "lucide-react";
import { createContext, useContext } from "react";

export const FormContext = createContext({ submitCount: 0 });
export const useFormContext = () => useContext(FormContext);

export const ICON_MAP = {
  search: Search, mail: Mail, lock: Lock, user: User,
  phone: Phone, calendar: Calendar, link: Link, hash: Hash,
};

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function resolveIcon(icon) {
  if (!icon) return null;
  return typeof icon === "string" ? ICON_MAP[icon.toLowerCase()] : icon;
}

export const BASE_INPUT = [
  "w-full text-[13px] rounded-lg border bg-[#ffffff] text-[#1e293b]",
  "placeholder-[#94a3b8] transition-all outline-none",
].join(" ");

export function borderState(showError, showValid) {
  if (showError) return "border-[#fca5a5] ring-2 ring-[#fee2e2] focus:border-[#f87171] focus:ring-[#fee2e2]";
  if (showValid) return "border-[#6ee7b7] ring-2 ring-[#d1fae5] focus:border-[#34d399]";
  return "border-[#e2e8f0] focus:border-[#94a3b8] focus:ring-2 focus:ring-[#0f172a]/5";
}

export function Label({ title, required, htmlFor }) {
  if (!title) return null;
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-semibold text-[#334155]">
      {title}
      {required && <span className="ml-0.5 text-[#7b5757]0">*</span>}
    </label>
  );
}

export function ErrorMsg({ show, message = "This field is required" }) {
  if (!show) return null;
  return <p className="text-[11px] text-[#7b5757]0 leading-tight">{message}</p>;
}

export function TrailingIcon({ showError, showValid, fallback = null }) {
  const { AlertCircle, CheckCircle2 } = require("lucide-react");
  if (showError) return <AlertCircle  className="absolute right-2.5 w-4 h-4 text-[#f87171]     pointer-events-none" />;
  if (showValid) return <CheckCircle2 className="absolute right-2.5 w-4 h-4 text-[#34d399] pointer-events-none" />;
  return fallback;
}
