const LOCALE = "en-IN";
const TIME_ONLY = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function parseDate(value) {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function hasMeaningfulTime(d, raw) {
  const s = String(raw ?? "");
  if (/T\d{2}:\d{2}/.test(s)) {
    const t = s.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (t) return t[1] !== "00" || t[2] !== "00" || (t[3] && t[3] !== "00");
  }
  return d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0;
}

/** @param {string} input */
export function formatTime12h(input) {
  if (input == null || input === "") return null;
  const str = String(input).trim();
  const m = str.match(TIME_ONLY);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = m[2];
    const h12 = h % 12 || 12;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h12}:${min} ${ampm}`;
  }
  const d = parseDate(input);
  if (d) {
    return d.toLocaleTimeString(LOCALE, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  return str;
}

/** @param {string|Date} input */
export function formatDateTime12h(input) {
  if (input == null || input === "") return null;
  const d = parseDate(input);
  if (!d) return String(input);
  return d.toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** @param {string|Date} input */
export function formatDateOnly(input) {
  if (input == null || input === "") return null;
  const d = parseDate(input);
  if (!d) return String(input);
  return d.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const DATE_ONLY_KEYS = new Set([
  "scheduled_date",
  "valid_from",
  "valid_until",
  "date_of_birth",
  "dob",
]);

const MONEY_KEYS = new Set([
  "amount",
  "base_price",
  "unit_price",
  "final_price",
  "estimated_price",
  "price",
  "tax_amount",
  "gst_amount",
  "tds_amount",
  "min_order_amount",
  "max_discount_amount",
]);

function formatCurrency(value) {
  const raw = String(value).trim();
  if (raw.startsWith("\u20b9")) return raw;
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return `\u20b9${value}`;
  return `\u20b9${n.toLocaleString(LOCALE, { maximumFractionDigits: 2 })}`;
}

/**
 * Returns a formatted display string for table cells, or null to use the raw value.
 * @param {unknown} value
 * @param {{ dataKey?: string, type?: string, header?: string }} col
 */
export function formatCellValue(value, col = {}) {
  if (value == null || value === "") return null;

  const { dataKey = "", type = "", header = "" } = col;
  const str = String(value).trim();
  const key = dataKey.toLowerCase();
  const headerLower = String(header).toLowerCase();

  if (type === "time") return formatTime12h(str);
  if (type === "datetime") return formatDateTime12h(str);
  if (type === "date") return formatDateOnly(str);

  const isMoneyField =
    MONEY_KEYS.has(key) ||
    /_(amount|price)$/.test(key) ||
    (/\b(amount|price)\b/.test(headerLower) && !/%|percent|percentage|rate/.test(headerLower));

  if (isMoneyField) {
    return formatCurrency(value);
  }

  const isTimeField =
    /_time$/.test(key) ||
    key === "scheduled_time" ||
    (/\btime\b/.test(headerLower) && !/\btimezone\b/.test(headerLower));

  if (isTimeField) {
    return formatTime12h(str);
  }

  if (DATE_ONLY_KEYS.has(key) || type === "date") {
    if (ISO_DATE.test(str) || parseDate(str)) return formatDateOnly(str);
    return null;
  }

  const isDateTimeField =
    /_at$/.test(key) ||
    /_(on|date_time)$/.test(key) ||
    /^(created|updated|paid|issued|deleted|completed|cancelled)_/.test(key);

  if (isDateTimeField) {
    const d = parseDate(str);
    if (d) return formatDateTime12h(d);
    return null;
  }

  if (TIME_ONLY.test(str)) return formatTime12h(str);

  if (ISO_DATE.test(str) || str.includes("T")) {
    const d = parseDate(str);
    if (d && hasMeaningfulTime(d, str)) return formatDateTime12h(d);
  }

  return null;
}
