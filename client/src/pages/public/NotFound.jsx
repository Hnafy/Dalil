import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container-page flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
        <Compass className="h-10 w-10" />
      </div>
      <p className="text-6xl font-extrabold text-slate-300">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-800">{t("notFound.title")}</h1>
      <p className="mt-2 max-w-md text-slate-500">{t("notFound.text")}</p>
      <Link to="/" className="btn-primary mt-6">
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}
