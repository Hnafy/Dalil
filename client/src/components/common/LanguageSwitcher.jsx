import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { changeLanguage } from "../../i18n";

export default function LanguageSwitcher({ variant = "light" }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const light = variant === "light";

  const container = light
    ? "inline-flex items-center rounded-xl border border-slate-200 bg-surface"
    : "inline-flex items-center rounded-xl bg-white/10 ring-1 ring-white/20";
  const label = light
    ? "text-slate-600 hover:bg-slate-50"
    : "text-white hover:bg-white/10";

  return (
    <div className={container}>
      <Languages className={`mx-2 h-4 w-4 ${light ? "text-brand-600 dark:text-brand-400" : "text-brand-200"}`} />
      <button
        type="button"
        onClick={() => changeLanguage(isAr ? "en" : "ar")}
        aria-label={t("lang.switch")}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${label} transition`}
      >
        {isAr ? "English" : "العربية"}
      </button>
    </div>
  );
}
