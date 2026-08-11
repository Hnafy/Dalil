import { useTranslation } from "react-i18next";
import { VEHICLE_TYPES } from "../../utils/constants";

export default function DriverCard({ driver }) {
  const { t } = useTranslation();
  const meta = VEHICLE_TYPES.find((v) => v.value === driver.vehicleType) || { emoji: "🛵" };

  return (
    <div className="card flex items-center gap-4 p-5 transition hover:shadow-lift">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100">
        {driver.photo?.url ? (
          <img src={driver.photo.url} alt={driver.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">{meta.emoji}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-800">{driver.name}</p>
        <span className="badge mt-1.5 bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30">
          {meta.emoji} {t(`drivers.vehicleTypes.${driver.vehicleType}`)}
        </span>
      </div>
    </div>
  );
}
