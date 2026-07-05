/** @format */

import { GET, POST, PUT, PATCH, DELETE } from "./coreClient.js";

// ------------------ CUSTOMER ADMIN APIs ------------------
export const customerAdminAPI = {
  getUsers: (data) => POST("/admin/users/paginated", data || {}),
  getUserById: (data) => POST("/admin/users/get", data),
  createUser: (data) => POST("/admin/users/create", data),
  updateUser: (data) => POST("/admin/users/update", data),
  deleteUser: (data) => POST("/admin/users/delete", data),
  verifyEmail: (data) => POST("/admin/users/verify-email", data),
  verifyMobile: (data) => POST("/admin/users/verify-mobile", data),
  getUserBookings: (data) => POST("/admin/users/bookings", data),
  getUserAddresses: (data) => POST("/admin/users/addresses", data),
  addUserAddress: (data) => POST("/admin/users/address", data),
  updateUserAddress: (data) => POST("/admin/users/address/update", data),
  activateUserAddress: (data) => POST("/admin/users/address/activate", data),
  deleteUserAddress: (data) => POST("/admin/users/address/delete", data),
  getUserActivityLogs: (data) => POST("/admin/users/activity-logs", data),
  getUserServiceCategories: (data) =>
    POST("/admin/users/service-categories", data),
  getUserServicesList: (data) => POST("/admin/users/services/list", data),
  getUserPromotionsHome: (data) => POST("/admin/users/promotions/home", data),

  getMenus: () => GET("/admin/user-menus"),
  createMenu: (data) => POST("/admin/user-menus", data),
  updateMenu: (id, data) => PUT(`/admin/user-menus/${id}`, data),
  deleteMenu: (id) => DELETE(`/admin/user-menus/${id}`),
};

export const userAdminAPI = customerAdminAPI;

// ------------------ USER MOBILE APIs ------------------
export const userMobileAPI = {
  sendOtp: (data) => POST("/user/send-otp", data),
  verifyOtp: (data) => POST("/user/verify-otp", data),
  getProfile: () => GET("/user/profile"),
  updateProfile: (data) => POST("/user/update-profile", data),
  updateAddress: (data) => POST("/user/address", data),
  activateAddress: (data) => POST("/user/activate-address", data),
  deleteAddress: (data) => POST("/user/delete-address", data),
  getAddresses: () => GET("/user/address"),
  getServiceCategories: () => GET("/user/services/categories"),
  getServices: (categoryId) =>
    GET("/user/services/list", { category_id: categoryId }),
  getServiceDetails: (data) => POST("/user/services/details", data),
  getHomeOffers: () => GET("/user/promotions/home/offers"),
  openBookingCart: () => POST("/user/booking/cart", {}),
  getBookingCart: () => GET("/user/booking/cart"),
  patchBookingCart: (data) => PATCH("/user/booking/cart", data),
  getCartSlots: () => GET("/user/booking/cart/slots"),
  getCartSlotsByAddress: (addressId, date) =>
    GET("/user/booking/cart/slots-by-address", { address_id: addressId, ...(date ? { date } : {}) }),
  postCartQuote: (data) => POST("/user/booking/cart/quote", data),
  postCartLock: () => POST("/user/booking/cart/lock", {}),
  getCoupons: () => GET("/user/coupons"),
  getReferral: () => GET("/user/referral"),
  applyReferralCode: (referralCode) => POST("/user/referral/apply", { referral_code: referralCode }),
  createBooking: (data) => POST("/user/create-booking", data),
  getBookingList: () => GET("/user/bookings"),
  getBookingDetails: (data) => POST("/user/booking-details", data),
};
