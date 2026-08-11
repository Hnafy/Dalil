import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute, ManagerRoute } from "./ProtectedRoutes";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";

import Home from "../pages/public/Home";
import Shops from "../pages/public/Shops";
import ShopDetails from "../pages/public/ShopDetails";
import CategoryShops from "../pages/public/CategoryShops";
import Drivers from "../pages/public/Drivers";
import NotFound from "../pages/public/NotFound";
import AdminLogin from "../pages/auth/AdminLogin";
import ManagerLogin from "../pages/auth/ManagerLogin";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminShops from "../pages/admin/AdminShops";
import AdminDrivers from "../pages/admin/AdminDrivers";
import AdminManagers from "../pages/admin/AdminManagers";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminAnalytics from "../pages/admin/AdminAnalytics";
import AdminSettings from "../pages/admin/AdminSettings";

import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ManagerShopEdit from "../pages/manager/ManagerShopEdit";
import ManagerGallery from "../pages/manager/ManagerGallery";
import ManagerHours from "../pages/manager/ManagerHours";
import ManagerAnalytics from "../pages/manager/ManagerAnalytics";
import ManagerSettings from "../pages/manager/ManagerSettings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/shops/:slug" element={<ShopDetails />} />
        <Route path="/categories/:slug" element={<CategoryShops />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/manager/login" element={<ManagerLogin />} />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="drivers" element={<AdminDrivers />} />
        <Route path="managers" element={<AdminManagers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/manager"
        element={
          <ManagerRoute>
            <ManagerLayout />
          </ManagerRoute>
        }
      >
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="shop" element={<ManagerShopEdit />} />
        <Route path="gallery" element={<ManagerGallery />} />
        <Route path="hours" element={<ManagerHours />} />
        <Route path="analytics" element={<ManagerAnalytics />} />
        <Route path="change-password" element={<ManagerSettings />} />
      </Route>
    </Routes>
  );
}
