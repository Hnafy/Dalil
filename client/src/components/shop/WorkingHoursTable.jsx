import { DAYS } from "../../utils/constants";
import { formatTime } from "../../utils/formatters";
import { useTranslation } from "react-i18next";

function todayKey() {
  // DAYS is Saturday-first; Date.getDay() is Sunday-first (0 = Sunday).
  return DAYS[(new Date().getDay() + 1) % 7].key;
}

export default function WorkingHoursTable({ workingHours }) {
  const { t } = useTranslation();
  const today = todayKey();

  return (
    <div className="card overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {DAYS.map((d) => {
          const slot = workingHours?.[d.key] || { isOpen: false };
          const isToday = d.key === today;
          return (
            <li
              key={d.key}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                isToday ? "bg-brand-50/60 dark:bg-brand-950/40" : ""
              }`}
            >
              <span
                className={`font-medium ${isToday ? "font-bold text-brand-700 dark:text-brand-300" : "text-slate-700"}`}
              >
                {t(`days.${d.key}`)}
                {isToday && (
                  <span className="ml-2 badge bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">{t("common.today")}</span>
                )}
              </span>
              <span
                className={
                  slot.isOpen
                    ? "font-semibold text-slate-700"
                    : "font-medium text-slate-400"
                }
              >
                {slot.isOpen ? `${formatTime(slot.open)} – ${formatTime(slot.close)}` : t("common.closed")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
