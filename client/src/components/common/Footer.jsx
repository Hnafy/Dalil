import { Link } from "react-router-dom";
import { MapPinned, MapPin, Phone } from "lucide-react";
import { AREA_NAME } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import logo from '../../img/logo.png'

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-300 dark:border-slate-200 dark:bg-slate-50 dark:text-slate-700">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center">
              <img src={logo} alt="logo" />
            </span>
            <span className="text-xl font-extrabold text-white">
              Dalil
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 dark:text-slate-600">{t("brand.description")}</p>
          <div className="mt-4">
            <LanguageSwitcher variant="dark" />
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-200 dark:text-slate-800">{t("footer.explore")}</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="transition hover:text-brand-400">
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link to="/shops" className="transition hover:text-brand-400">
                {t("nav.allShops")}
              </Link>
            </li>
            <li>
              <Link to="/shops?openNow=true" className="transition hover:text-brand-400">
                {t("nav.openNow")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-200 dark:text-slate-800">{t("footer.forBusiness")}</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/manager/login" className="transition hover:text-brand-400">
                {t("nav.managerLogin")}
              </Link>
            </li>
            <li>
              <Link to="/admin/login" className="transition hover:text-brand-400">
                {t("nav.adminLogin")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-200 dark:text-slate-800">{t("footer.contact")}</h4>
          <ul className="space-y-2 text-sm text-slate-400 dark:text-slate-600">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-400" /> {AREA_NAME}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-400" /> {t("footer.support")}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500 dark:border-slate-200">
        {t("footer.rights", { year: new Date().getFullYear(), area: AREA_NAME })}
      </div>
    </footer>
  );
}
