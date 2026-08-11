import { useEffect, useState } from "react";
import { Eye, Phone, MapPin, MessageCircle, TrendingUp } from "lucide-react";
import { getManagerAnalytics } from "../../services/managerService";
import StatCard from "../../components/dashboard/StatCard";
import SimpleBarChart from "../../components/dashboard/SimpleBarChart";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatViews } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function ManagerDashboard() {
  const { t } = useTranslation();
  usePageMeta(t("meta.managerDashboard"), "");
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    getManagerAnalytics()
      .then((res) => active && setData(res.data))
      .catch(() => active && setData(null));
    return () => {
      active = false;
    };
  }, []);

  if (!data) return <SkeletonTable rows={4} cols={4} />;

  const { shop, totals, ranges, clicks, trend } = data;

  const clicksList = [
    { label: t("managerDashboard.phoneClicks"), value: clicks.phone_click || 0, icon: Phone, color: "text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/10" },
    { label: t("managerDashboard.whatsappClicks"), value: clicks.whatsapp_click || 0, icon: MessageCircle, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" },
    { label: t("managerDashboard.mapsClicks"), value: clicks.maps_click || 0, icon: MapPin, color: "text-accent-600 bg-accent-50 dark:text-accent-300 dark:bg-accent-500/10" },
    { label: t("managerDashboard.websiteClicks"), value: clicks.website_click || 0, icon: TrendingUp, color: "text-purple-600 bg-purple-50 dark:text-purple-300 dark:bg-purple-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{localize(shop, "name")}</h2>
          <p className="text-sm text-slate-500">{t("managerDashboard.assignedShop", { views: formatViews(shop.views) })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label={t("managerDashboard.totalViews")} value={formatViews(totals.totalViews)} />
        <StatCard icon={Eye} label={t("managerDashboard.viewsToday")} value={formatViews(ranges.viewsToday)} />
        <StatCard icon={Eye} label={t("managerDashboard.viewsWeek")} value={formatViews(ranges.viewsWeek)} />
        <StatCard icon={Eye} label={t("managerDashboard.viewsMonth")} value={formatViews(ranges.viewsMonth)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-slate-900">{t("managerDashboard.viewsLast7")}</h2>
          {trend.length > 0 ? (
            <SimpleBarChart data={trend} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              {t("managerDashboard.noViews")}
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">{t("managerDashboard.engagement")}</h2>
          <ul className="space-y-3">
            {clicksList.map((c) => (
              <li key={c.label} className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.color}`}>
                  <c.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-slate-600">{c.label}</span>
                <span className="text-lg font-extrabold text-slate-900">{c.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
