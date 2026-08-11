import { create } from "zustand";
import {
  adminLogin,
  managerLogin,
  logout as logoutRequest,
  getMe,
} from "../services/authService";

const useAuthStore = create((set) => ({
  user: null,
  status: "loading", // "loading" | "authenticated" | "unauthenticated"

  fetchMe: async () => {
    try {
      const res = await getMe();
      set({ user: res.data.user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  login: async (role, credentials) => {
    const res = role === "admin" ? await adminLogin(credentials) : await managerLogin(credentials);
    set({ user: res.data.user, status: "authenticated" });
    return res.data.user;
  },

  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore — cookie will be cleared locally regardless
    }
    set({ user: null, status: "unauthenticated" });
  },
}));

export default useAuthStore;
