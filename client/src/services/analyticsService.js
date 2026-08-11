import api from "./api";

export const recordView = (shopId, visitorId) =>
  api.post("/analytics/view", { shopId, visitorId }).then((res) => res.data);

export const recordClick = (shopId, visitorId, type) =>
  api.post("/analytics/click", { shopId, visitorId, type }).then((res) => res.data);
