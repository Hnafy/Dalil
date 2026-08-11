import axios from "axios";
import i18n from "../i18n";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || i18n.t("common.somethingWentWrong");
    error.safeMessage = message;
    return Promise.reject(error);
  }
);

export default api;
