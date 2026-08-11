import { useEffect, useState } from "react";
import { Eye, Phone, MessageCircle, MapPin, MousePointerClick } from "lucide-react";
import { getManagerAnalytics } from "../../services/managerService";
import StatCard from "../../components/dashboard/StatCard";
import SimpleBarChart from "../../components/dashboard/SimpleBarChart";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { formatViews } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function ManagerAnalytics() {
  const { t } = useTranslation();
  usePageMeta(t("meta.managerAnalytics"), "");
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

  const clickRows = [
    { label: t("managerAnalytics.phone"), icon: Phone, value: clicks.phone_click || 0 },
    { label: t("managerAnalytics.whatsapp"), icon: MessageCircle, value: clicks.whatsapp_click || 0 },
    { label: t("managerAnalytics.googleMaps"), icon: MapPin, value: clicks.maps_click || 0 },
    { label: t("managerAnalytics.website"), icon: MousePointerClick, value: clicks.website_click || 0 },
    { label: t("managerAnalytics.facebook"), icon: MousePointerClick, value: clicks.facebook_click || 0 },
    { label: t("managerAnalytics.instagram"), icon: MousePointerClick, value: clicks.instagram_click || 0 },
    { label: t("managerAnalytics.tiktok"), icon: MousePointerClick, value: clicks.tiktok_click || 0 },
  ];

  const totalClicks = clickRows.reduce((acc, r) => acc + r.value, 0);

  return (
    <div className="space-y-8">
      <div className="card p-5">
        <h2 className="text-lg font-bold text-slate-900">{localize(shop, "name")}</h2>
        <p className="text-sm text-slate-500">{t("managerAnalytics.forYourShopOnly")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label={t("managerAnalytics.totalViews")} value={formatViews(totals.totalViews)} />
        <StatCard icon={Eye} label={t("managerAnalytics.viewsToday")} value={formatViews(ranges.viewsToday)} />
        <StatCard icon={Eye} label={t("managerAnalytics.viewsWeek")} value={formatViews(ranges.viewsWeek)} />
        <StatCard icon={Eye} label={t("managerAnalytics.viewsMonth")} value={formatViews(ranges.viewsMonth)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-6 text-lg font-bold text-slate-900">{t("managerAnalytics.viewsLast7")}</h2>
          {trend.length > 0 ? (
            <SimpleBarChart data={trend} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">{t("managerAnalytics.noViewData")}</p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-1 text-lg font-bold text-slate-900">{t("managerAnalytics.clickThroughs")}</h2>
          <p className="mb-4 text-sm text-slate-400">{t("managerAnalytics.totalClicks", { count: totalClicks })}</p>
          <div className="space-y-2.5">
            {clickRows.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                  <r.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-slate-600">{r.label}</span>
                <span className="font-bold text-slate-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
