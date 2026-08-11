import { Clock } from "lucide-react";
import { formatTime } from "../../utils/formatters";
import { useTranslation } from "react-i18next";

export default function StatusBadge({ openStatus, showLabel = true }) {
  const { t } = useTranslation();
  if (!openStatus) return null;
  const { isOpen, nextOpenAt } = openStatus;

  if (isOpen) {
    return (
      <span className="badge bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {showLabel ? t("status.openNow") : t("status.open")}
      </span>
    );
  }

  return (
    <span className="badge bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
      <Clock className="h-3.5 w-3.5" />
      {nextOpenAt ? `${t("status.closedOpens")} ${formatTime(nextOpenAt)}` : t("status.closedNow")}
    </span>
  );
}
