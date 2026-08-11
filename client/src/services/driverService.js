import api from "./api";

export const getDrivers = (params) => api.get("/drivers", { params }).then((res) => res.data);
