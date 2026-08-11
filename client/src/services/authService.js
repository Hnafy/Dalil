import api from "./api";

export const adminLogin = (credentials) =>
  api.post("/auth/admin/login", credentials).then((res) => res.data);

export const managerLogin = (credentials) =>
  api.post("/auth/manager/login", credentials).then((res) => res.data);

export const logout = () => api.post("/auth/logout").then((res) => res.data);

export const getMe = () => api.get("/auth/me").then((res) => res.data);

export const changePassword = (payload) =>
  api.patch("/auth/change-password", payload).then((res) => res.data);
