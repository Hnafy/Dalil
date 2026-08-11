import api from "./api";

export const getShops = (params) => api.get("/shops", { params }).then((res) => res.data);

export const getShopBySlug = (slug) => api.get(`/shops/${slug}`).then((res) => res.data);

export const searchShops = (params) => api.get("/shops/search", { params }).then((res) => res.data);

export const getCategories = () => api.get("/categories").then((res) => res.data);
