import { useEffect, useState } from "react";
import { Eye, Phone, MapPin, MessageCircle, TrendingUp, Power } from "lucide-react";
import { toast } from "sonner";
import { getManagerAnalytics, setManualStatus } from "../../services/managerService";
import StatCard from "../../components/dashboard/StatCard";
import SimpleBarChart from "../../components/dashboard/SimpleBarChart";
import StatusBadge from "../../components/common/StatusBadge";
import Spinner from "../../components/common/Spinner";
import { SkeletonTable } from "../../components/common/SkeletonCard";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useShopStatus } from "../../hooks/useShopStatus";
import { formatViews } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
import { localize } from "../../utils/i18n";

export default function ManagerDashboard() {
  const { t } = useTranslation();
  usePageMeta(t("meta.managerDashboard"), "");
  const [data, setData] = useState(null);
  const [manualStatus, setManualStatusState] = useState("auto");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getManagerAnalytics()
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setManualStatusState(res.data.shop.manualStatus || "auto");
      })
      .catch(() => active && setData(null));
    return () => {
      active = false;
    };
  }, []);

  const handleSetStatus = async (status) => {
    setSaving(true);
    try {
      await setManualStatus(status);
      setManualStatusState(status);
      toast.success(
        status === "open"
          ? t("managerDashboard.setManualOpen")
          : status === "closed"
          ? t("managerDashboard.setManualClose")
          : t("managerDashboard.setManualAuto")
      );
    } catch {
      toast.error(t("managerDashboard.failedSetStatus"));
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <SkeletonTable rows={4} cols={4} />;

  const { shop, totals, ranges, clicks, trend } = data;
  const openStatus = useShopStatus(shop.workingHours, manualStatus);

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

      {/* Instant Status Control */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
              <Power className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{t("managerDashboard.instantStatusTitle")}</p>
              <p className="text-sm text-slate-500">{t("managerDashboard.instantStatusHint")}</p>
            </div>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <StatusBadge openStatus={openStatus} />
            <button
              onClick={() => handleSetStatus("open")}
              disabled={saving || manualStatus === "open"}
              className={`btn text-sm ${manualStatus === "open" ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300" : "btn-primary"}`}
            >
              {saving && <Spinner size="sm" />}
              {t("managerDashboard.instantOpen")}
            </button>
            <button
              onClick={() => handleSetStatus("closed")}
              disabled={saving || manualStatus === "closed"}
              className={`btn text-sm ${manualStatus === "closed" ? "bg-red-100 text-red-600 ring-1 ring-red-300" : "btn-secondary"}`}
            >
              {t("managerDashboard.instantClose")}
            </button>
            <button
              onClick={() => handleSetStatus("auto")}
              disabled={saving || manualStatus === "auto"}
              className={`btn text-sm ${manualStatus === "auto" ? "bg-slate-200 text-slate-700 ring-1 ring-slate-300" : "btn-secondary"}`}
            >
              {t("managerDashboard.instantAuto")}
            </button>
          </div>
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
