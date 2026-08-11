import api from "./api";

// Shops
export const adminGetShops = (params) => api.get("/admin/shops", { params }).then((res) => res.data);
export const adminCreateShop = (payload) => api.post("/admin/shops", payload).then((res) => res.data);
export const adminUpdateShop = (id, payload) => api.patch(`/admin/shops/${id}`, payload).then((res) => res.data);
export const adminDeleteShop = (id) => api.delete(`/admin/shops/${id}`).then((res) => res.data);

// Managers
export const adminGetManagers = () => api.get("/admin/managers").then((res) => res.data);
export const adminCreateManager = (payload) => api.post("/admin/managers", payload).then((res) => res.data);
export const adminUpdateManager = (id, payload) => api.patch(`/admin/managers/${id}`, payload).then((res) => res.data);
export const adminDeleteManager = (id) => api.delete(`/admin/managers/${id}`).then((res) => res.data);
export const adminResetManagerPassword = (id, newPassword) =>
  api.post(`/admin/managers/${id}/reset-password`, { newPassword }).then((res) => res.data);

// Categories
export const adminGetCategories = () => api.get("/admin/categories").then((res) => res.data);
export const adminCreateCategory = (payload) => api.post("/admin/categories", payload).then((res) => res.data);
export const adminUpdateCategory = (id, payload) => api.patch(`/admin/categories/${id}`, payload).then((res) => res.data);
export const adminDeleteCategory = (id) => api.delete(`/admin/categories/${id}`).then((res) => res.data);

// Analytics
export const adminGetAnalytics = () => api.get("/admin/analytics").then((res) => res.data);
