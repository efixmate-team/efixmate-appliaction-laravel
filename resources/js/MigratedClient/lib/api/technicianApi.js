/** @format */

import { GET, POST, PATCH } from "./coreClient.js";

// ------------------ TECHNICIAN ADMIN APIs ------------------
export const technicianAdminAPI = {
  getTechnicians: (data) => POST("/admin/technicians/paginated", data || {}),
  getTechnicianById: (data) => POST("/admin/technicians/detail", data),
  createTechnician: (data) => POST("/admin/technicians/create", data),
  approveTechnician: (data) => POST("/admin/technicians/approve", data),
  verifyDocument: (data) => POST("/admin/technicians/verify-doc", data),
  verifyBank: (data) => POST("/admin/technicians/verify-bank", data),
  reviewSection: (data) => POST("/admin/technicians/review-section", data),
  manageServices: (data) => POST("/admin/technicians/manage-services", data),

  // Ops actions
  suspend: (data) => POST("/admin/technicians/suspend", data),
  forceOffline: (data) => POST("/admin/technicians/force-offline", data),
  getPerformance: (technicianId) => GET("/admin/technicians/performance", { technician_id: technicianId }),
  getJobs: (technicianId, params = {}) => GET("/admin/technicians/jobs", { technician_id: technicianId, ...params }),
  getEarnings: (technicianId, params = {}) => GET("/admin/technicians/earnings", { technician_id: technicianId, ...params }),
  getComplaints: (technicianId, params = {}) => GET("/admin/technicians/complaints", { technician_id: technicianId, ...params }),
  reassignArea: (data) => PATCH("/admin/technicians/reassign-area", data),
  reassignSkills: (data) => PATCH("/admin/technicians/reassign-skills", data),

  getMenus: () => GET("/admin/technician-menus"),
  createMenu: (data) => POST("/admin/technician-menus-create", data),
  updateMenu: (data) => POST("/admin/technician-menus-update", data),
  deleteMenu: (data) => POST("/admin/technician-menus-delete", data),
};
