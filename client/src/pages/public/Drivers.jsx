import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { SearchX } from "lucide-react";
import { getDrivers } from "../../services/driverService";
import DriverCard from "../../components/driver/DriverCard";
import SectionHeading from "../../components/common/SectionHeading";
import { SkeletonGrid } from "../../components/common/SkeletonCard";
import EmptyState from "../../components/common/EmptyState";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useTranslation } from "react-i18next";
import { VEHICLE_TYPES } from "../../utils/constants";

export default function Drivers() {
  const { t } = useTranslation();
  usePageMeta(t("meta.drivers"), t("meta.driversDescription"));
  const [searchParams, setSearchParams] = useSearchParams();
  const vehicleType = searchParams.get("vehicleType") || "";
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let active = true;
    setRows(null);
    getDrivers({ vehicleType })
      .then((res) => active && setRows(res.data))
      .catch((err) => {
        if (active) {
          setRows({ drivers: [] });
          toast.error(err.safeMessage || t("drivers.failedToLoad"));
        }
      });
    return () => {
      active = false;
    };
  }, [vehicleType]);

  const selectType = (value) => {
    setSearchParams(value ? { vehicleType: value } : {});
  };

  const tabs = [
    { value: "", label: t("drivers.allTypes") },
    ...VEHICLE_TYPES.map((v) => ({ value: v.value, label: t(`drivers.vehicleTypes.${v.value}`) })),
  ];

  return (
    <div className="container-page py-12 sm:py-16">
      <SectionHeading
        eyebrow={t("drivers.eyebrow")}
        title={t("drivers.title")}
        subtitle={t("drivers.subtitle", { area: "Abou Ghaleb" })}
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            onClick={() => selectType(tab.value)}
            className={vehicleType === tab.value ? "btn-primary" : "btn-secondary"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {!rows ? (
          <SkeletonGrid count={6} />
        ) : rows.drivers.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("drivers.noDriversTitle")}
            subtitle={t("drivers.noDriversSubtitle")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.drivers.map((driver) => (
              <DriverCard key={driver.id} driver={driver} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
