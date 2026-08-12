import { NavLink, useNavigate } from "react-router-dom";
import { MapPinned, LogOut, X } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import { useTranslation } from "react-i18next";
import ThemeSwitcher from "../common/ThemeSwitcher";
import logo from '../../img/logo.png'

export default function Sidebar({ items, brand, onNavigate, open, onClose }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    navigate("/");
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <NavLink to="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="flex h-9 w-9 items-center justify-center ">
            <img src={logo} alt="logo" />
          </span>
          <span className="text-lg font-extrabold text-slate-900">{brand}</span>
        </NavLink>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label={t("sidebar.closeSidebar")}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-600 text-white shadow-card"
                  : "text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold uppercase text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              {user?.name?.[0] || "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <span className="ml-auto">
              <ThemeSwitcher />
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5" /> {t("sidebar.logout")}
          </button>
        </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-surface lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-slate-100/50" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
