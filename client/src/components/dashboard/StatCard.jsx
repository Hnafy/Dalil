import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function StatCard({ icon: Icon, label, value, hint, trend }) {
  const { t } = useTranslation();
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
          {Icon && <Icon className="h-5 w-5" />}
        </span>
      </div>
      {trend !== undefined && (
        <p
          className={`mt-3 flex items-center gap-1 text-xs font-semibold ${
            trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
          }`}
        >
          {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend >= 0 ? "+" : ""}
          {trend}% {t("dashboard.vsLastPeriod")}
        </p>
      )}
    </div>
  );
}
