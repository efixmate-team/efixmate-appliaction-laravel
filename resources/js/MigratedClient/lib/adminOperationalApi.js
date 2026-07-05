/**
 * Admin operational control center APIs (screen-specific).
 */
import { BASE_URL } from "./api/coreClient.js";

const BASE = BASE_URL || "/api";

async function request(endpoint, method = "GET", data = null) {
  const path = `/${String(endpoint).replace(/^\/+/, "")}`;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...(data && { body: JSON.stringify(data) }),
    });

    const json = await res.json().catch(() => ({ status: false, message: res.statusText }));
    if (!res.ok) return { status: false, message: json.message || res.statusText };
    if (json.status === undefined) json.status = true;
    return json;
  } catch (error) {
    return {
      status: false,
      networkError: true,
      message:
        error instanceof Error && error.message
          ? `Network error: ${error.message}`
          : "Unable to reach the server. Please check that the API is running.",
    };
  }
}

const GET = (url, params = {}) => {
  const q = Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return request(`${url}${q ? `?${q}` : ""}`, "GET");
};
const POST = (url, data) => request(url, "POST", data);
const PATCH = (url, data) => request(url, "PATCH", data);
const PUT = (url, data) => request(url, "PUT", data);
const DELETE = (url) => request(url, "DELETE");

async function requestForm(endpoint, formData) {
  const path = `/${String(endpoint).replace(/^\/+/, "")}`;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const json = await res.json().catch(() => ({ status: false, message: res.statusText }));
    if (!res.ok) return { status: false, message: json.message || res.statusText };
    if (json.status === undefined) json.status = true;
    return json;
  } catch (error) {
    return {
      status: false,
      networkError: true,
      message:
        error instanceof Error && error.message
          ? `Network error: ${error.message}`
          : "Unable to reach the server. Please check that the API is running.",
    };
  }
}

export const adminOperationalAPI = {
  dashboard: {
    liveMetrics: () => GET("/admin/dashboard/live-metrics"),
    liveBookings: (params) => GET("/admin/dashboard/live-bookings", params),
    technicianMap: () => GET("/admin/dashboard/technician-map"),
    revenueSummary: (params) => GET("/admin/dashboard/revenue-summary", params),
    systemHealth: () => GET("/admin/dashboard/system-health"),
  },
  bookings: {
    live: (params) => GET("/admin/bookings/live", params),
    workflowDashboard: () => GET("/admin/bookings/workflow/dashboard"),
    workflow: (params) => GET("/admin/bookings/workflow", params),
    overview: (id) => GET(`/admin/bookings/${id}/overview`),
    detail: (id) => GET(`/admin/bookings/${id}/detail`),
    timeline: (id) => GET(`/admin/bookings/${id}/timeline`),
    timelineUnified: (id) => GET(`/admin/bookings/${id}/timeline/unified`),
    chat: (id) => GET(`/admin/bookings/${id}/chat`),
    fraud: (id) => GET(`/admin/bookings/${id}/fraud`),
    duplicates: (id) => GET(`/admin/bookings/${id}/duplicates`),
    tagsCatalog: () => GET("/admin/bookings/tags/catalog"),
    disputes: (params) => GET("/admin/bookings/dispute", params),
    reassign: (data) => POST("/admin/bookings/reassign", data),
    replaceTechnician: (data) => POST("/admin/bookings/replace-technician", data),
    forceComplete: (data) => POST("/admin/bookings/force-complete", data),
    escalate: (data) => POST("/admin/bookings/escalate", data),
    dispute: (data) => POST("/admin/bookings/dispute", data),
    stateOverride: (data) => POST("/admin/bookings/state-override", data),
    autoAssign: (id) => POST(`/admin/bookings/${id}/auto-assign`),
    assignMultiple: (id, data) => POST(`/admin/bookings/${id}/assign-multiple`, data),
    nearbyTechnicians: (id) => GET(`/admin/bookings/${id}/nearby-technicians`),
    dispatch: (id, data) => POST(`/admin/bookings/${id}/dispatch`, data),
    emergency: (id, data) => POST(`/admin/bookings/${id}/emergency`, data),
    reschedule: (id, data) => POST(`/admin/bookings/${id}/reschedule`, data),
    internalNote: (id, data) => POST(`/admin/bookings/${id}/internal-notes`, data),
    setTags: (id, data) => POST(`/admin/bookings/${id}/tags`, data),
    bulk: (data) => POST("/admin/bookings/bulk", data),
  },
  technicians: {
    verify: (data) => POST("/admin/technicians/verify", data),
    suspend: (data) => POST("/admin/technicians/suspend", data),
    forceOffline: (data) => POST("/admin/technicians/force-offline", data),
    reassignArea: (data) => PATCH("/admin/technicians/reassign-area", data),
    reassignSkills: (data) => PATCH("/admin/technicians/reassign-skills", data),
    performance: (params) => GET("/admin/technicians/performance", params),
    complaints: (params) => GET("/admin/technicians/complaints", params),
  },
  pricing: {
    configs: (params) => GET("/admin/pricing/configs", params),
    dynamic: (data) => POST("/admin/pricing/dynamic", data),
    surge: (data) => POST("/admin/pricing/surge", data),
    peakHours: (data) => POST("/admin/pricing/peak-hours", data),
    emergency: (data) => POST("/admin/pricing/emergency", data),
    commission: (data) => POST("/admin/pricing/commission/config", data),
    rules: (data) => POST("/admin/pricing-rule-paginated", data),
    createRule: (data) => POST("/admin/pricing-rules-create", data),
    updateRule: (data) => POST("/admin/pricing-rules-update", data),
    toggleRule: (data) => POST("/admin/pricing-rules-toggle", data),
  },
  slots: {
    list: (params) => GET("/admin/slots", params),
    create: (data) => POST("/admin/slots", data),
    capacity: (data) => POST("/admin/slots/capacity", data),
    holidays: (data) => POST("/admin/slots/holidays", data),
    emergency: (data) => POST("/admin/slots/emergency", data),
  },
  serviceAreas: {
    list: () => GET("/admin/service-areas"),
    save: (data) => POST("/admin/service-areas", data),
    zones: (data) => POST("/admin/service-areas/zones", data),
    pincodes: (data) => POST("/admin/service-areas/pincodes", data),
    geoFencing: (data) => POST("/admin/service-areas/geo-fencing", data),
  },
  finance: {
    dashboard: (params) => GET("/admin/finance/dashboard", params),
    revenue: (params) => GET("/admin/finance/revenue", params),
    gst: (params) => GET("/admin/finance/gst", params),
    tds: (params) => GET("/admin/finance/tds", params),
    settlements: (params) => GET("/admin/finance/settlements", params),
    commissions: (params) => GET("/admin/finance/commissions", params),
    wallet: (params) => GET("/admin/finance/wallet", params),
    payouts: (params) => GET("/admin/finance/payouts", params),
    refunds: (params) => GET("/admin/finance/refunds", params),
    failedPayments: (params) => GET("/admin/finance/failed-payments", params),
    invoices: (params) => GET("/admin/finance/invoices", params),
    generateInvoice: (data) => POST("/admin/finance/invoices/generate", data),
    exportReport: (params) => GET("/admin/finance/export", params),
    reconciliation: (params) => GET("/admin/finance/reconciliation", params),
    approveRefund: (data) => POST("/admin/finance/refunds/approve", data),
    processSettlement: (data) => POST("/admin/finance/settlements/process", data),
    // Legacy aliases
    exportSettlements: (params) => GET("/admin/settlements/export", params),
    walletAudit: (params) => GET("/admin/wallet/audit", params),
  },
  notifications: {
    dashboard: () => GET("/admin/notifications/dashboard"),
    meta: () => GET("/admin/notifications/meta"),
    templates: (params) => GET("/admin/notifications/templates", params),
    template: (id) => GET(`/admin/notifications/templates/${id}`),
    saveTemplate: (data) => POST("/admin/notifications/templates", data),
    deleteTemplate: (id) => DELETE(`/admin/notifications/templates/${id}`),
    campaigns: (params) => GET("/admin/notifications/campaigns", params),
    createCampaign: (data) => POST("/admin/notifications/campaigns", data),
    send: (data) => POST("/admin/notifications/send", data),
    broadcast: (data) => POST("/admin/notifications/broadcast", data),
    sendSingle: (data) => POST("/admin/notifications/send-single", data),
    delivery: (params) => GET("/admin/notifications/delivery", params),
    logs: (params) => GET("/admin/notifications/logs", params),
    deliveryReport: (params) => GET("/admin/notifications/delivery-report", params),
    retryDelivery: (id) => POST(`/admin/notifications/delivery/${id}/retry`),
    bulkRetry: (data) => POST("/admin/notifications/delivery/bulk-retry", data),
    schedules: (params) => GET("/admin/notifications/schedules", params),
    saveSchedule: (data) => POST("/admin/notifications/schedules", data),
    updateSchedule: (id, data) => PATCH(`/admin/notifications/schedules/${id}`, data),
    cancelSchedule: (id) => DELETE(`/admin/notifications/schedules/${id}`),
    runSchedule: (id) => POST(`/admin/notifications/schedules/${id}/run`),
    processDueSchedules: () => POST("/admin/notifications/schedules/process-due"),
    inbox: (params) => GET("/admin/notifications/inbox", params),
    inboxUnreadCount: () => GET("/admin/notifications/inbox/unread-count"),
    markInboxRead: (id) => PATCH(`/admin/notifications/inbox/${id}/read`),
    markAllInboxRead: () => POST("/admin/notifications/inbox/mark-all-read"),
  },
  support: {
    meta: () => GET("/admin/support/meta"),
    dashboard: () => GET("/admin/support/dashboard"),
    tickets: (params) => GET("/admin/support/tickets", params),
    ticket: (id, params) => GET(`/admin/support/tickets/${id}`, params),
    createTicket: (data) => POST("/admin/support/tickets", data),
    createTicketForm: (formData) => requestForm("/admin/support/tickets", formData),
    updateStatus: (id, data) => PATCH(`/admin/support/tickets/${id}/status`, data),
    reply: (id, data) => POST(`/admin/support/tickets/${id}/replies`, data),
    replyForm: (id, formData) => requestForm(`/admin/support/tickets/${id}/replies`, formData),
    internalNote: (id, data) => POST(`/admin/support/tickets/${id}/internal-notes`, data),
    categories: (params) => GET("/admin/support/categories", params),
    saveCategory: (data) => POST("/admin/support/categories", data),
    slaPolicies: () => GET("/admin/support/sla-policies"),
    saveSlaPolicy: (data) => POST("/admin/support/sla-policies", data),
    escalate: (data) => POST("/admin/support/escalate", data),
    assign: (data) => POST("/admin/support/assign", data),
    disputes: (params) => GET("/admin/support/disputes", params),
    analytics: () => GET("/admin/support/analytics"),
  },
  analytics: {
    revenue: (params) => GET("/admin/analytics/revenue", params),
    bookings: (params) => GET("/admin/analytics/bookings", params),
    customers: (params) => GET("/admin/analytics/customers", params),
    technicians: (params) => GET("/admin/analytics/technicians", params),
    funnel: (params) => GET("/admin/analytics/funnel", params),
  },
  cms: {
    pages: (params) => GET("/admin/cms/pages", params),
    page: (id) => GET(`/admin/cms/pages/${id}`),
    createPage: (data) => POST("/admin/cms/pages", data),
    updatePage: (id, data) => PATCH(`/admin/cms/pages/${id}`, data),
    publishPage: (id) => POST(`/admin/cms/pages/${id}/publish`, {}),
    unpublishPage: (id) => POST(`/admin/cms/pages/${id}/unpublish`, {}),
    deletePage: (id) => DELETE(`/admin/cms/pages/${id}`),
    banners: (params) => GET("/admin/cms/banners", params),
    banner: (id) => GET(`/admin/cms/banners/${id}`),
    createBanner: (data) => POST("/admin/cms/banners", data),
    updateBanner: (id, data) => PATCH(`/admin/cms/banners/${id}`, data),
    deleteBanner: (id) => DELETE(`/admin/cms/banners/${id}`),
    uploadImage: (file) => {
      const fd = new FormData();
      fd.append("image", file);
      return requestForm("/admin/cms/upload", fd);
    },
    seoList: (entity_type) => GET("/admin/cms/seo", { entity_type }),
    seoUpsert: (data) => PUT("/admin/cms/seo", data),
    suggestSlug: (q) => GET("/admin/cms/seo/suggest-slug", { q }),
    saveBanner: (data) => POST("/admin/cms/banners", data),

    // ── Home sections ────────────────────────────────────────────────────────
    homeServices: (params) => GET("/admin/cms/home/services", params),
    homeService: (id) => GET(`/admin/cms/home/services/${id}`),
    createHomeService: (data) => POST("/admin/cms/home/services", data),
    updateHomeService: (id, data) => PATCH(`/admin/cms/home/services/${id}`, data),
    deleteHomeService: (id) => DELETE(`/admin/cms/home/services/${id}`),
    reorderHomeServices: (data) => POST("/admin/cms/home/services/reorder", data),

    testimonials: (params) => GET("/admin/cms/home/testimonials", params),
    testimonial: (id) => GET(`/admin/cms/home/testimonials/${id}`),
    createTestimonial: (data) => POST("/admin/cms/home/testimonials", data),
    updateTestimonial: (id, data) => PATCH(`/admin/cms/home/testimonials/${id}`, data),
    deleteTestimonial: (id) => DELETE(`/admin/cms/home/testimonials/${id}`),
    reorderTestimonials: (data) => POST("/admin/cms/home/testimonials/reorder", data),

    serveCategories: (params) => GET("/admin/cms/home/serve-categories", params),
    serveCategory: (id) => GET(`/admin/cms/home/serve-categories/${id}`),
    createServeCategory: (data) => POST("/admin/cms/home/serve-categories", data),
    updateServeCategory: (id, data) => PATCH(`/admin/cms/home/serve-categories/${id}`, data),
    deleteServeCategory: (id) => DELETE(`/admin/cms/home/serve-categories/${id}`),
    reorderServeCategories: (data) => POST("/admin/cms/home/serve-categories/reorder", data),

    // ── Services page section ────────────────────────────────────────────────
    serviceOfferings: (params) => GET("/admin/cms/services/offerings", params),
    serviceOffering: (id) => GET(`/admin/cms/services/offerings/${id}`),
    createServiceOffering: (data) => POST("/admin/cms/services/offerings", data),
    updateServiceOffering: (id, data) => PATCH(`/admin/cms/services/offerings/${id}`, data),
    deleteServiceOffering: (id) => DELETE(`/admin/cms/services/offerings/${id}`),
    reorderServiceOfferings: (data) => POST("/admin/cms/services/offerings/reorder", data),

    // ── About sections ───────────────────────────────────────────────────────
    statistics: (params) => GET("/admin/cms/about/statistics", params),
    statistic: (id) => GET(`/admin/cms/about/statistics/${id}`),
    createStatistic: (data) => POST("/admin/cms/about/statistics", data),
    updateStatistic: (id, data) => PATCH(`/admin/cms/about/statistics/${id}`, data),
    deleteStatistic: (id) => DELETE(`/admin/cms/about/statistics/${id}`),
    reorderStatistics: (data) => POST("/admin/cms/about/statistics/reorder", data),

    story: () => GET("/admin/cms/about/story"),
    upsertStory: (data) => PUT("/admin/cms/about/story", data),

    teamMembers: (params) => GET("/admin/cms/about/team", params),
    teamMember: (id) => GET(`/admin/cms/about/team/${id}`),
    createTeamMember: (data) => POST("/admin/cms/about/team", data),
    updateTeamMember: (id, data) => PATCH(`/admin/cms/about/team/${id}`, data),
    deleteTeamMember: (id) => DELETE(`/admin/cms/about/team/${id}`),
    reorderTeamMembers: (data) => POST("/admin/cms/about/team/reorder", data),

    // ── Contact sections ─────────────────────────────────────────────────────
    faqs: (params) => GET("/admin/cms/contact/faqs", params),
    faq: (id) => GET(`/admin/cms/contact/faqs/${id}`),
    createFaq: (data) => POST("/admin/cms/contact/faqs", data),
    updateFaq: (id, data) => PATCH(`/admin/cms/contact/faqs/${id}`, data),
    deleteFaq: (id) => DELETE(`/admin/cms/contact/faqs/${id}`),
    reorderFaqs: (data) => POST("/admin/cms/contact/faqs/reorder", data),

    workingHours: () => GET("/admin/cms/contact/working-hours"),
    updateWorkingHour: (id, data) => PATCH(`/admin/cms/contact/working-hours/${id}`, data),
    bulkUpdateWorkingHours: (data) => PUT("/admin/cms/contact/working-hours", data),

    // ── Footer sections ──────────────────────────────────────────────────────
    socialLinks: (params) => GET("/admin/cms/footer/social-links", params),
    socialLink: (id) => GET(`/admin/cms/footer/social-links/${id}`),
    createSocialLink: (data) => POST("/admin/cms/footer/social-links", data),
    updateSocialLink: (id, data) => PATCH(`/admin/cms/footer/social-links/${id}`, data),
    deleteSocialLink: (id) => DELETE(`/admin/cms/footer/social-links/${id}`),
    reorderSocialLinks: (data) => POST("/admin/cms/footer/social-links/reorder", data),

    footerLinks: (params) => GET("/admin/cms/footer/links", params),
    footerLink: (id) => GET(`/admin/cms/footer/links/${id}`),
    createFooterLink: (data) => POST("/admin/cms/footer/links", data),
    updateFooterLink: (id, data) => PATCH(`/admin/cms/footer/links/${id}`, data),
    deleteFooterLink: (id) => DELETE(`/admin/cms/footer/links/${id}`),
    reorderFooterLinks: (data) => POST("/admin/cms/footer/links/reorder", data),

    contactInfo: () => GET("/admin/cms/footer/contact-info"),
    upsertContactInfo: (key, data) => PATCH(`/admin/cms/footer/contact-info/${key}`, data),
    bulkUpdateContactInfo: (data) => PUT("/admin/cms/footer/contact-info", data),

    footerVisibility: () => GET("/admin/cms/footer/visibility"),
    updateFooterVisibility: (data) => PUT("/admin/cms/footer/visibility", data),
    publishSection: (key) => POST(`/admin/cms/sections/${encodeURIComponent(key)}/publish`, {}),
    updatePageStatus: (slug, data) => PATCH(`/admin/cms/pages/${encodeURIComponent(slug)}/status`, data),
    pageVersions: (slug) => GET(`/admin/cms/pages/${encodeURIComponent(slug)}/versions`),
  },
  security: {
    dashboard: () => GET("/admin/security/dashboard"),
    loginHistory: (params) => GET("/admin/security/login-history", params),
    sessions: (params) => GET("/admin/security/sessions", params),
    revokeSession: (id) => DELETE(`/admin/security/sessions/${id}`),
    revokeAllSessions: (data) => POST("/admin/security/sessions/revoke-all", data),
    failedLogins: (params) => GET("/admin/security/failed-logins", params),
    ipRules: () => GET("/admin/security/ip-rules"),
    saveIpRule: (data) => POST("/admin/security/ip-rules", data),
    deleteIpRule: (id) => DELETE(`/admin/security/ip-rules/${id}`),
    alerts: (params) => GET("/admin/security/alerts", params),
    activity: (params) => GET("/admin/security/activity", params),
    totpStatus: () => GET("/admin/security/2fa/status"),
    totpSetup: () => POST("/admin/security/2fa/setup"),
    totpEnable: (data) => POST("/admin/security/2fa/enable", data),
    totpDisable: (data) => POST("/admin/security/2fa/disable", data),
    stepUp: (data) => POST("/admin/security/step-up", data),
  },
  audit: {
    logs: (params) => GET("/admin/audit/logs", params),
    actionTypes: () => GET("/admin/audit/action-types"),
    securityEvents: (params) => GET("/admin/security/events", params),
  },
  realtime: {
    technicians: () => GET("/admin/realtime/technicians"),
    bookings: () => GET("/admin/realtime/bookings"),
    systemHealth: () => GET("/admin/realtime/system-health"),
  },
  crm: {
    dashboard: () => GET("/admin/crm/dashboard"),
    customers: (params) => GET("/admin/crm/customers", params),
    customer: (id) => GET(`/admin/crm/customers/${id}`),
    timeline: (id, params) => GET(`/admin/crm/customers/${id}/timeline`, params),
    clv: (id) => GET(`/admin/crm/customers/${id}/clv`),
    referrals: (id, params) => GET(`/admin/crm/customers/${id}/referrals`, params),
    loyalty: (id, params) => GET(`/admin/crm/customers/${id}/loyalty`, params),
    adjustLoyalty: (id, data) => POST(`/admin/crm/customers/${id}/loyalty/adjust`, data),
    wallet: (id, params) => GET(`/admin/crm/customers/${id}/wallet`, params),
    creditWallet: (id, data) => POST(`/admin/crm/customers/${id}/wallet/credit`, data),
    complaints: (params) => GET("/admin/crm/complaints", params),
    createComplaint: (id, data) => POST(`/admin/crm/customers/${id}/complaints`, data),
    updateComplaint: (id, data) => PATCH(`/admin/crm/complaints/${id}`, data),
    spamList: (params) => GET("/admin/crm/spam", params),
    spamScan: (id) => POST(`/admin/crm/spam/scan/${id}`),
    block: (id, data) => POST(`/admin/crm/customers/${id}/block`, data),
    unblock: (id, data) => POST(`/admin/crm/customers/${id}/unblock`, data),
    blockHistory: (id) => GET(`/admin/crm/customers/${id}/block-history`),
    notes: (id) => GET(`/admin/crm/customers/${id}/notes`),
    addNote: (id, data) => POST(`/admin/crm/customers/${id}/notes`, data),
    communications: (id, params) => GET(`/admin/crm/customers/${id}/communications`, params),
    addCommunication: (id, data) => POST(`/admin/crm/customers/${id}/communications`, data),
    analyticsClv: (params) => GET("/admin/crm/analytics/clv", params),
    analyticsReferrals: () => GET("/admin/crm/analytics/referrals"),
  },
  contactInquiries: {
    stats: () => GET("/admin/contact-inquiries/stats"),
    list: (params) => GET("/admin/contact-inquiries", params),
    get: (id) => GET(`/admin/contact-inquiries/${id}`),
    update: (id, data) => PATCH(`/admin/contact-inquiries/${id}`, data),
  },
  tracker: {
    metrics: (params) => GET("/admin/tracker/metrics", params),
    setSpend: (data) => POST("/admin/tracker/marketing-spend", data),
  },
};
