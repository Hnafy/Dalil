import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  MapPinned,
  Menu,
  X,
  ChevronDown,
  LogIn,
  Store,
  UserCog,
  Compass,
} from "lucide-react";
import { getCategories } from "../../services/shopService";
import { AREA_NAME } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import { localize } from "../../utils/i18n";

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const catRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const closeAll = () => {
    setOpen(false);
    setCatOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={closeAll}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card">
            <MapPinned className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Dalil<span className="text-brand-600">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            {t("nav.home")}
          </NavLink>
          <NavLink to="/shops" className={navLinkClass}>
            {t("nav.shops")}
          </NavLink>
          <div className="relative" ref={catRef}>
            <button
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {t("nav.categories")}
              <ChevronDown className={`h-4 w-4 transition ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-surface p-2 shadow-lift ring-1 ring-slate-200">
                <Link
                  to="/shops"
                  onClick={closeAll}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                >
                  <Compass className="h-4 w-4" /> {t("nav.allShops")}
                </Link>
                <div className="my-1 border-t border-slate-100" />
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/categories/${c.slug}`}
                    onClick={closeAll}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                  >
                    {localize(c, "name")}
                    <span className="badge bg-slate-100 text-slate-500">{c.shopCount || 0}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Link
            to="/manager/login"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <Store className="h-4 w-4" /> {t("nav.manager")}
          </Link>
          <Link to="/admin/login" className="btn-primary !py-2">
            <LogIn className="h-4 w-4" /> {t("nav.admin")}
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={t("nav.toggleMenu")}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-surface px-4 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            <NavLink to="/" end onClick={closeAll} className={navLinkClass}>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/shops" onClick={closeAll} className={navLinkClass}>
              {t("nav.shops")}
            </NavLink>
            <p className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              {t("nav.categories")}
            </p>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/categories/${c.slug}`}
                onClick={closeAll}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
              >
                {localize(c, "name")}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <LanguageSwitcher />
              <ThemeSwitcher />
              <Link to="/manager/login" onClick={closeAll} className="btn-secondary">
                <Store className="h-4 w-4" /> {t("nav.managerLogin")}
              </Link>
              <Link to="/admin/login" onClick={closeAll} className="btn-primary">
                <UserCog className="h-4 w-4" /> {t("nav.adminLogin")}
              </Link>
            </div>
          </nav>
        </div>
      )}

      <p className="sr-only">{t("nav.area", { area: AREA_NAME })}</p>
    </header>
  );
}
