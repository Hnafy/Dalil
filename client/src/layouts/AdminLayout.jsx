import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  LayoutDashboard,
  Store,
  Users,
  FolderTree,
  BarChart3,
  Settings,
} from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import { useTranslation } from "react-i18next";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { to: "/admin/dashboard", label: t("adminLayout.dashboard"), icon: LayoutDashboard },
    { to: "/admin/shops", label: t("adminLayout.shops"), icon: Store },
    { to: "/admin/managers", label: t("adminLayout.managers"), icon: Users },
    { to: "/admin/categories", label: t("adminLayout.categories"), icon: FolderTree },
    { to: "/admin/analytics", label: t("adminLayout.analytics"), icon: BarChart3 },
    { to: "/admin/settings", label: t("adminLayout.settings"), icon: Settings },
  ];

  const titles = {
    "/admin/dashboard": t("adminLayout.dashboard"),
    "/admin/shops": t("adminLayout.shopManagement"),
    "/admin/managers": t("adminLayout.managerManagement"),
    "/admin/categories": t("adminLayout.categories"),
    "/admin/analytics": t("adminLayout.analytics"),
    "/admin/settings": t("adminLayout.settings"),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        items={navItems}
        brand={t("adminLayout.brand")}
        open={open}
        onClose={() => setOpen(false)}
        onNavigate={() => setOpen(false)}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-surface/90 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label={t("sidebar.openSidebar")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">{titles[pathname] || t("adminLayout.titleFallback")}</h1>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
