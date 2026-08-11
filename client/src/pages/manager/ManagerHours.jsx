import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Clock } from "lucide-react";
import { getMyShop, updateWorkingHours } from "../../services/managerService";
import WorkingHoursEditor from "../../components/dashboard/WorkingHoursEditor";
import Spinner from "../../components/common/Spinner";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useTranslation } from "react-i18next";

export default function ManagerHours() {
  const { t } = useTranslation();
  usePageMeta(t("meta.managerHours"), "");
  const [hours, setHours] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getMyShop()
      .then((res) => active && setHours(res.data.workingHours || {}))
      .catch((err) => toast.error(err.safeMessage || t("managerHours.failedToLoad")));
    return () => {
      active = false;
    };
  }, [t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWorkingHours(hours);
      toast.success(t("managerHours.updated"));
    } catch (err) {
      toast.error(err.safeMessage || t("managerHours.failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  if (!hours) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card flex items-start gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
          <Clock className="h-5 w-5" />
        </span>
        <p className="text-sm leading-relaxed text-slate-600">
          {t("managerHours.hint")}
        </p>
      </div>

      <div className="card p-6">
        <WorkingHoursEditor value={hours} onChange={setHours} />
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
          {t("managerHours.saveWorkingHours")}
        </button>
      </div>
    </div>
  );
}
