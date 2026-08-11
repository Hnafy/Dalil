import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  ArrowRight,
} from "lucide-react";
import { adminGetAnalytics } from "../../services/adminService";
import StatCard from "../../components/dashboard/StatCard";
import SimpleBarChart from "../../components/dashboard/SimpleBarChart";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatViews } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function AdminDashboard() {
  const { t } = useTranslation();
  usePageMeta(t("meta.adminDashboard"), "");
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    adminGetAnalytics()
      .then((res) => active && setData(res.data))
      .catch(() => active && setData(null));
    return () => {
      active = false;
    };
  }, []);

  if (!data) return <SkeletonTable rows={4} cols={4} />;

  const { totals, ranges, trend, topShops } = data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Store} label={t("adminDashboard.totalShops")} value={totals.totalShops} />
        <StatCard icon={CheckCircle2} label={t("adminDashboard.activeShops")} value={totals.activeShops} />
        <StatCard icon={XCircle} label={t("adminDashboard.inactiveShops")} value={totals.inactiveShops} />
        <StatCard icon={Users} label={t("adminDashboard.managers")} value={totals.totalManagers} />
        <StatCard icon={Eye} label={t("adminDashboard.totalViews")} value={formatViews(totals.totalViews)} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={Eye} label={t("adminDashboard.viewsToday")} value={formatViews(ranges.viewsToday)} />
        <StatCard icon={Eye} label={t("adminDashboard.viewsWeek")} value={formatViews(ranges.viewsWeek)} />
        <StatCard icon={Eye} label={t("adminDashboard.viewsMonth")} value={formatViews(ranges.viewsMonth)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-slate-900">{t("adminDashboard.viewsLast7")}</h2>
          {trend.length > 0 ? (
            <SimpleBarChart data={trend} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              {t("adminDashboard.noViewData")}
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">{t("adminDashboard.topShops")}</h2>
          {topShops.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t("adminDashboard.noDataYet")}</p>
          ) : (
            <ul className="space-y-3">
              {topShops.map((s, i) => (
                <li key={s.shopId}>
                  <Link
                    to={`/shops/${s.slug}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                      {localize(s, "name")}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                      <Eye className="h-3.5 w-3.5" /> {formatViews(s.views)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/analytics" className="btn-secondary mt-4 w-full">
            {t("adminDashboard.fullAnalytics")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
