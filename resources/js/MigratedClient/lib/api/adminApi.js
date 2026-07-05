/** @format */

import { DELETE, GET, POST, PUT, request, requestMultipart } from "./coreClient.js";
export { adminOperationalAPI } from "../adminOperationalApi.js";

// ------------------ ADMIN APIs (Next admin app; masters/users/bookings use masterAPI / *AdminAPI) ------------------
export const adminAPI = {
  // ------------------ AUTH ------------------
  register: (data) => POST("/admin/create", data),
  login: (data) => POST("/admin/login", data),
  verify2faLogin: (data) => POST("/admin/login/verify-2fa", data),
  profile: () => GET("/admin/profile"),
  changePassword: (data) => POST("/admin/change-password", data),
  resetPassword: (data) => POST("/admin/reset-password", data),

  // ------------------ ADMIN MANAGEMENT ------------------
  getAdmins: (data) => POST("/admin/admin-paginated", data || {}),
  getAdminById: (data) => POST("/admin/get", data),
  updateAdmin: (data) => POST("/admin/update", data),
  deleteAdmin: (data) => POST("/admin/toggle-status", data),

  // ------------------ ROLES ------------------
  createRole: (data) => POST("/admin/roles-create", data),
  getRoles: (data) => POST("/admin/role-paginated", data),
  updateRole: (data) => POST("/admin/roles-update", data),
  deleteRole: (data) => POST("/admin/roles-delete", data),
  toggleRole: (data) => POST("/admin/roles-toggle", data),
  getRoleDropdown: () => GET("/admin/roles-dropdown"),
  getRolePermissions: (data) => POST("/admin/role-permissions", data),
  toggleRolePermission: (data) => POST("/admin/role-permissions-toggle", data),

  // ------------------ PRIVILEGES ------------------
  createPrivilege: (data) => POST("/admin/privileges-create", data),
  updatePrivilege: (data) => POST("/admin/privileges-update", data),
  deletePrivilege: (data) => POST("/admin/privileges-delete", data),
  privilegesByMenu: (data) => POST("/admin/privileges-by-menu", data),
  privilegesListWithMenu: (data) =>
    POST("/admin/privileges-list-with-menu", data || {}),

  // ------------------ MENUS ------------------
  getMenus: () => GET("/admin/menus"),
  createMenu: (data) => POST("/admin/create-menus", data),
  updateMenu: (data) => POST("/admin/update-menus", data),
  paginatedMenu: (data) => POST("/admin/menu-paginated", data),
  activateMenu: (data) => POST("/admin/activate-menus", data),
  deactivateMenu: (data) => POST("/admin/deactivate-menus", data),
  bulkActivateMenu: (data) => POST("/admin/bulk-activate-menus", data),
  bulkDeactivateMenu: (data) => POST("/admin/bulk-deactivate-menus", data),
  getMenuParent: () => GET("/admin/get-parents"),
  getMenuGroup: () => GET("/admin/get-groups"),
  deleteMenu: (data) => POST("/admin/delete-menus", data),

  // ------------------ DASHBOARD ------------------
  getDashboardStats: (params) => GET("/admin/dashboard/stats", params),
  getRecentBookings: (params) =>
    GET("/admin/dashboard/recent-bookings", params),
  getTopServices: (params) => GET("/admin/dashboard/top-services", params),
  getDashboardActivity: (params) => GET("/admin/dashboard/activity", params),

  // ------------------ ADMIN PERSONAL SETTINGS ------------------
  getSettings: () => GET("/admin/settings"),
  updateSettings: (data) => POST("/admin/settings", { settings: data }),
  getUploadSettings: () => GET("/admin/upload-settings"),
  updateUploadSettings: (policy) => POST("/admin/upload-settings", { policy }),

  // ------------------ PAYMENT GATEWAY SETTINGS ------------------
  getPaymentSettings: () => GET("/admin/settings/payment-gateway"),
  updatePaymentSettings: (settings) => POST("/admin/settings/payment-gateway", { settings }),

  // ------------------ NOTIFICATION SETTINGS ------------------
  getNotificationSettings: () => GET("/admin/settings/notifications"),
  updateNotificationSettings: (settings) => POST("/admin/settings/notifications", { settings }),

  // ------------------ SERVICES ------------------
  getServicesByCategory: (data) => POST("/admin/services-by-category", data),

  // ------------------ SKILLS ------------------
  getSkills: (data) => POST("/admin/skills-list", data),
  getSkillById: (data) => POST("/admin/skills-get", data),
  createSkill: (data) => POST("/admin/skills-create", data),
  updateSkill: (data) => POST("/admin/skills-update", data),
  toggleSkill: (data) => POST("/admin/skills-toggle", data),
  deleteSkill: (data) => POST("/admin/skills-delete", data),
  setSkillServices: (data) => POST("/admin/skills-set-services", data),
  getSkillServices: (params) => GET("/admin/skills-services", params),
  getSkillsDropdown: (params) => GET("/admin/skills-dropdown", params),

  // ------------------ BOOKING CREATION (admin on behalf of customer) ------------------
  createBooking: (data) => POST("/admin/bookings/create", data),

  // ------------------ AREA CONFIGURATION COPY ------------------
  copyAreaSetup: (data) => POST("/admin/areas-copy-setup", data),
};

// ------------------ LOOKUP APIs (read-only reference / dropdown data) ------------------
export const lookupAPI = {
  getLookups: (resource, params = {}) => GET(`/lookup/${resource}`, params),
  getLookupById: (resource, id) => GET(`/lookup/${resource}/${id}`),
  createLookup: (resource, data) => POST(`/lookup/${resource}`, data),
  bulkCreateLookup: (resource, data) => POST(`/lookup/${resource}/bulk`, data),
  updateLookup: (resource, id, data) => PUT(`/lookup/${resource}/${id}`, data),
  deleteLookup: (resource, id) => DELETE(`/lookup/${resource}/${id}`),

  getStatuses: (params) => GET("/lookup/statuses", params),
  getStatusTypes: (params) => GET("/lookup/status-types", params),
  getDocumentTypes: (params) => GET("/lookup/document-types", params),
  getBookingTypes: (params) => GET("/lookup/booking-types", params),
  getPaymentModes: (params) => GET("/lookup/payment-modes", params),
  getCurrencies: (params) => GET("/lookup/currencies", params),
  getLanguages: (params) => GET("/lookup/languages", params),
  getTimezones: (params) => GET("/lookup/timezones", params),
  getUnits: (params) => GET("/lookup/units", params),
  getAreaTypes: (params) => GET("/lookup/area-types", params),
};

// ------------------ MASTER APIs (operational CRUD data) ------------------
export const masterAPI = {
  getLookups: (resource, params = {}) => GET(`/master/${resource}`, params),
  getLookupById: (resource, id) => GET(`/master/${resource}/${id}`),
  createLookup: (resource, data) => POST(`/master/${resource}`, data),
  updateLookup: (resource, id, data) => PUT(`/master/${resource}/${id}`, data),
  deleteLookup: (resource, id) => DELETE(`/master/${resource}/${id}`),

  getCountries: (params) => GET("/master/countries", params),
  createCountry: (data) => POST("/master/countries", data),
  updateCountry: (id, data) => PUT(`/master/countries/${id}`, data),
  deleteCountry: (id) => DELETE(`/master/countries/${id}`),

  getStates: (params) => GET("/master/states", params),
  createState: (data) => POST("/master/states", data),
  updateState: (id, data) => PUT(`/master/states/${id}`, data),
  deleteState: (id) => DELETE(`/master/states/${id}`),

  getCities: (params) => GET("/master/cities", params),
  createCity: (data) => POST("/master/cities", data),
  updateCity: (id, data) => PUT(`/master/cities/${id}`, data),
  deleteCity: (id) => DELETE(`/master/cities/${id}`),

  getAreas: (params) => GET("/master/areas", params),
  createArea: (data) => POST("/master/areas", data),
  updateArea: (id, data) => PUT(`/master/areas/${id}`, data),
  deleteArea: (id) => DELETE(`/master/areas/${id}`),

  getServiceCategories: (params) => GET("/master/service-categories", params),
  createServiceCategory: (data) => POST("/master/service-categories", data),
  updateServiceCategory: (id, data) =>
    PUT(`/master/service-categories/${id}`, data),
  deleteServiceCategory: (id) => DELETE(`/master/service-categories/${id}`),

  getServices: (params) => GET("/master/services", params),
  createService: (data) => POST("/master/services", data),
  updateService: (id, data) => PUT(`/master/services/${id}`, data),
  deleteService: (id) => DELETE(`/master/services/${id}`),

  getServicePricing: (params) => GET("/master/service-pricing", params),
  createServicePricing: (data) => POST("/master/service-pricing", data),
  updateServicePricing: (id, data) => PUT(`/master/service-pricing/${id}`, data),
  deleteServicePricing: (id) => DELETE(`/master/service-pricing/${id}`),

  getCommissions: (params) => GET("/master/commissions", params),
  getDiscounts: (params) => GET("/master/discounts", params),
  getTaxes: (params) => GET("/master/taxes", params),
  getCharges: (params) => GET("/master/charges", params),
  getCoupons: (params) => GET("/master/coupons", params),

  getUsers: (params) => GET("/master/users", params),
  getBookings: (params) => GET("/master/bookings", params),
  getPayments: (params) => GET("/master/payments", params),
  getInvoices: (params) => GET("/master/invoices", params),
  getRefunds: (params) => GET("/master/refunds", params),
  getPayouts: (params) => GET("/master/payouts", params),
};

// ------------------ ANNOUNCEMENT / PROMOTION ADMIN APIs ------------------
export const announcementAPI = {
  getAnnouncements: (data) => POST("/admin/promotions/paginated", data || {}),
  getAnalytics: () => GET("/admin/promotions/analytics"),
  createPromotion: (data) => POST("/admin/promotions", data),
  updatePromotion: (id, data) => PUT(`/admin/promotions/${id}`, data),
  createPromotionMultipart: (formData) =>
    requestMultipart("/admin/promotions", "POST", formData),
  updatePromotionMultipart: (id, formData) =>
    requestMultipart(`/admin/promotions/${id}`, "PUT", formData),
  deletePromotion: (id) => DELETE(`/admin/promotions/${id}`),
  duplicatePromotion: (id) => POST(`/admin/promotions/${id}/duplicate`, {}),
  reorderPromotions: (items) => POST("/admin/promotions/reorder", { items }),
  bulkPromotionAction: (data) => POST("/admin/promotions/bulk-action", data),
  previewPromotion: (id) => GET(`/admin/promotions/${id}/preview`),
  historyPromotion: (id) => GET(`/admin/promotions/${id}/history`),
};

export const promoAPI = {
  ...announcementAPI,
  getpromos: (body) => announcementAPI.getAnnouncements(body),
};

// ------------------ TEXT ANNOUNCEMENT ADMIN APIs ------------------
export const textAnnouncementAPI = {
  getAnnouncements: (data) =>
    POST("/admin/announcements/paginated", data || {}),
  getAnalytics: () => GET("/admin/announcements/analytics"),
  createAnnouncement: (data) => POST("/admin/announcements", data),
  updateAnnouncement: (id, data) => PUT(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id) => DELETE(`/admin/announcements/${id}`),
  duplicateAnnouncement: (id) =>
    POST(`/admin/announcements/${id}/duplicate`, {}),
  reorderAnnouncements: (items) =>
    POST("/admin/announcements/reorder", { items }),
  bulkAction: (data) => POST("/admin/announcements/bulk-action", data),
};

// ------------------ BOOKING ADMIN APIs ------------------
export const bookingAdminAPI = {
  getBookings: (data) => POST("/admin/bookings/paginated", data || {}),
  getBookingById: (id) => GET(`/admin/bookings/${id}`),
  getAssignments: (data) => POST("/admin/bookings/assignments", data || {}),
  refundBooking: (data) => POST("/admin/bookings/refund", data),
  confirmBooking: (data) => POST("/admin/bookings/confirm", data),
  createBookingForCustomer: (data) => POST("/master/bookings", data),
  reassign: (bookingId, technicianId, reason) =>
    POST("/admin/bookings/reassign", { bookingId, technicianId, reason }),
};
