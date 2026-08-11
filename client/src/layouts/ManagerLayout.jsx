import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  LayoutDashboard,
  Store,
  Images,
  Clock,
  BarChart3,
  KeyRound,
} from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import { useTranslation } from "react-i18next";

export default function ManagerLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { to: "/manager/dashboard", label: t("managerLayout.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/manager/shop", label: t("managerLayout.myShop"), icon: Store },
    { to: "/manager/gallery", label: t("managerLayout.gallery"), icon: Images },
    { to: "/manager/hours", label: t("managerLayout.hours"), icon: Clock },
    { to: "/manager/analytics", label: t("managerLayout.analytics"), icon: BarChart3 },
    { to: "/manager/change-password", label: t("managerLayout.changePassword"), icon: KeyRound },
  ];

  const titles = {
    "/manager/dashboard": t("managerLayout.dashboard"),
    "/manager/shop": t("managerLayout.myShop"),
    "/manager/gallery": t("managerLayout.galleryTitle"),
    "/manager/hours": t("managerLayout.hours"),
    "/manager/analytics": t("managerLayout.analytics"),
    "/manager/change-password": t("managerLayout.changePassword"),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        items={navItems}
        brand={t("managerLayout.brand")}
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
          <h1 className="text-lg font-bold text-slate-900">{titles[pathname] || t("managerLayout.titleFallback")}</h1>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
