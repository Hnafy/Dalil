import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Users, Eye, TrendingUp } from "lucide-react";
import { adminGetAnalytics } from "../../services/adminService";
import StatCard from "../../components/dashboard/StatCard";
import SimpleBarChart from "../../components/dashboard/SimpleBarChart";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatViews } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function AdminAnalytics() {
  const { t } = useTranslation();
  usePageMeta(t("meta.adminAnalytics"), "");
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Store} label={t("adminAnalytics.totalShops")} value={totals.totalShops} />
        <StatCard icon={Users} label={t("adminAnalytics.managers")} value={totals.totalManagers} />
        <StatCard icon={Eye} label={t("adminAnalytics.totalViews")} value={formatViews(totals.totalViews)} />
        <StatCard icon={TrendingUp} label={t("adminAnalytics.categories")} value={totals.totalCategories} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={Eye} label={t("adminAnalytics.viewsToday")} value={formatViews(ranges.viewsToday)} />
        <StatCard icon={Eye} label={t("adminAnalytics.viewsWeek")} value={formatViews(ranges.viewsWeek)} />
        <StatCard icon={Eye} label={t("adminAnalytics.viewsMonth")} value={formatViews(ranges.viewsMonth)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-slate-900">{t("adminAnalytics.viewsLast7")}</h2>
          {trend.length > 0 ? (
            <SimpleBarChart data={trend} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              {t("adminAnalytics.noViewData")}
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">{t("adminAnalytics.mostPopular")}</h2>
          {topShops.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t("adminAnalytics.noDataYet")}</p>
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
                    <span className="text-xs font-medium text-slate-400">{t("adminAnalytics.views", { count: formatViews(s.views) })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
