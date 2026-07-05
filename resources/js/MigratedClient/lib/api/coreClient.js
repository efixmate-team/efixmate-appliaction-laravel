/** @format */

import {
  adminScopeSearchParams,
  readPersistedAdminScope,
  shouldAttachAdminScope,
} from "../adminScopeQuery";

// API base URL - set once in NEXT_PUBLIC_API_URL.
// Examples:
//   NEXT_PUBLIC_API_URL=http://localhost:5000          → direct Express (no /api prefix)
//   NEXT_PUBLIC_API_URL=/api                         → same-origin Next.js proxy
//   NEXT_PUBLIC_API_URL=https://efixmate.com/api     → public API with /api prefix

const resolveBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    return "http://localhost:5000";
  }

  const cleaned = raw.replace(/\/+$/, "");

  if (
    typeof window !== "undefined" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleaned)
  ) {
    const host = window.location.hostname;
    const isLocalPage = host === "localhost" || host === "127.0.0.1";
    if (!isLocalPage) {
      return "/api";
    }
  }

  // Production: Next rewrites /api/* → backend. Keep the /api prefix in browser URLs.
  if (cleaned === "/api") {
    return "/api";
  }

  // Absolute URL (keep path, including trailing /api if present)
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  return cleaned;
};

export const BASE_URL = resolveBaseUrl();

/**
 * Public upload base — must match what nginx/Next can reach.
 * When API is at `/api`, files are at `/api/uploads` (Next rewrites to Express `/uploads`).
 */
export const UPLOADS_BASE_URL = (() => {
  const api = BASE_URL.replace(/\/+$/, "");
  if (api.endsWith("/api")) {
    return `${api}/uploads`;
  }
  return `${api}/uploads`;
})();

function stripUploadRel(path) {
  return String(path)
    .replace(/^\/+/, "")
    .replace(/^(api\/)?uploads\//i, "");
}

function isBrokenLocalUploadUrl(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url);
}

export function resolveUploadUrl(path) {
  if (!path) return "";
  const raw = String(path).trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    if (isBrokenLocalUploadUrl(raw)) {
      try {
        const rel = stripUploadRel(new URL(raw).pathname || raw);
        if (rel) {
          return `${UPLOADS_BASE_URL.replace(/\/+$/, "")}/${rel}`;
        }
      } catch {
        /* fall through */
      }
    }
    return raw.replace(
      /^(https?:\/\/[^/]+)\/(?!api\/)uploads\//i,
      "$1/api/uploads/",
    );
  }

  const clean = stripUploadRel(raw);
  if (!clean) return "";
  if (raw.startsWith("/api/uploads/") || raw.startsWith("/uploads/")) {
    return `${UPLOADS_BASE_URL.replace(/\/+$/, "")}/${clean}`;
  }
  return `${UPLOADS_BASE_URL.replace(/\/+$/, "")}/${clean}`;
}

console.log(
  BASE_URL
    ? `API Base URL: ${BASE_URL}`
    : "No API Base URL configured. Please set NEXT_PUBLIC_API_URL environment variable.",
);

const withBaseUrl = (endpoint) => {
  const baseUrl = BASE_URL.replace(/\/+$/, "");
  const path = `/${String(endpoint).replace(/^\/+/, "")}`;
  return `${baseUrl}${path}`;
};

const normalizeResponse = async (res) => {
  if (!res.ok) {
    let errorMessage = "Unauthorized";
    let errorBody = {};
    try {
      const error = await res.json();
      errorBody = error && typeof error === "object" ? error : {};
      errorMessage = error.message || errorMessage;
    } catch {
      errorMessage = res.statusText || `HTTP ${res.status}`;
    }

    if (
      (res.status === 403 || res.status === 401) &&
      typeof window !== "undefined"
    ) {
      console.warn(`Auth Error (${res.status}): ${errorMessage}`);
    }

    return { status: false, message: errorMessage, ...errorBody };
  }

  const json = await res.json();
  if (json && typeof json === "object" && json.status === undefined) {
    json.status = true;
  }
  return json;
};

const isNetworkFetchError = (err) =>
  err instanceof TypeError ||
  String(err?.message || "").toLowerCase().includes("fetch");

const networkErrorResponse = (err, method, endpoint) => {
  const isFetchFailure = isNetworkFetchError(err);

  console.error(
    `API request failed (${method} ${withBaseUrl(endpoint)}):`,
    err?.message || err,
  );

  return {
    status: false,
    networkError: true,
    message: isFetchFailure
      ? "Unable to reach the server. Make sure the API is running (port 5000 or Docker server service)."
      : err?.message || "Network error",
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, init, { method, endpoint }) {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (!isNetworkFetchError(err)) throw err;
    // One retry — covers nodemon restarts and brief connection drops during dev.
    await sleep(400);
    try {
      return await fetch(url, init);
    } catch (retryErr) {
      throw retryErr;
    }
  }
}

function mergeAdminScope(endpoint, data) {
  if (!shouldAttachAdminScope(endpoint)) return data;
  const scope = adminScopeSearchParams(readPersistedAdminScope());
  if (!Object.keys(scope).length) return data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return { ...scope, ...data };
  }
  if (data == null) return scope;
  return data;
}

export const request = async (endpoint, method = "GET", data = null) => {
  try {
    const payload = mergeAdminScope(endpoint, data);
    const res = await fetchWithRetry(
      withBaseUrl(endpoint),
      {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        ...(payload != null && method !== "GET" && { body: JSON.stringify(payload) }),
      },
      { method, endpoint },
    );

    return normalizeResponse(res);
  } catch (err) {
    return networkErrorResponse(err, method, endpoint);
  }
};

export const requestMultipart = async (
  endpoint,
  method = "POST",
  formData,
) => {
  try {
    const res = await fetchWithRetry(
      withBaseUrl(endpoint),
      {
        method,
        credentials: "include",
        body: formData,
      },
      { method, endpoint },
    );

    return normalizeResponse(res);
  } catch (err) {
    return networkErrorResponse(err, method, endpoint);
  }
};

export const GET = (url, params = {}) => {
  const merged = shouldAttachAdminScope(url)
    ? { ...adminScopeSearchParams(readPersistedAdminScope()), ...params }
    : params;
  const query = Object.keys(merged)
    .filter((k) => merged[k] !== undefined && merged[k] !== null)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(merged[k])}`)
    .join("&");
  return request(`${url}${query ? `?${query}` : ""}`, "GET");
};

export const POST = (url, data) => request(url, "POST", data);
export const PUT = (url, data) => request(url, "PUT", data);
export const PATCH = (url, data) => request(url, "PATCH", data);
export const DELETE = (url) => request(url, "DELETE");
