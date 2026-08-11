import api from "./api";

export const getMyShop = () => api.get("/manager/shop").then((res) => res.data);

export const updateMyShop = (payload) => api.patch("/manager/shop", payload).then((res) => res.data);

export const uploadImages = (formData) =>
  api.post("/manager/shop/images", formData).then((res) => res.data);

export const deleteImage = (imageId) =>
  api.delete(`/manager/shop/images/${imageId}`).then((res) => res.data);

export const updateWorkingHours = (workingHours) =>
  api.patch("/manager/shop/working-hours", { workingHours }).then((res) => res.data);

export const getManagerAnalytics = () => api.get("/manager/analytics").then((res) => res.data);
