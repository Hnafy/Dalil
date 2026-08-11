import { Outlet, Link, useLocation } from "react-router-dom";
import { MapPinned, Home, Store, Grid2x2 } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useTranslation } from "react-i18next";

export default function PublicLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const isBottomNavHidden = location.pathname.startsWith("/shops/") || location.pathname.startsWith("/categories/");
  const mobileLinks = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/shops", label: t("nav.shops"), icon: Store },
    { to: "/shops?openNow=true", label: t("nav.openNow"), icon: Grid2x2 },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {!isBottomNavHidden && (
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-surface/95 backdrop-blur md:hidden">
          <div className="flex">
            {mobileLinks.map((l) => {
              const active =
                l.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(l.to.split("?")[0]);
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                    active ? "text-brand-600 dark:text-brand-400" : "text-slate-400"
                  }`}
                >
                  <l.icon className="h-5 w-5" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
