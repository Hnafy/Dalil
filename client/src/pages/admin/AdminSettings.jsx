import { ShieldCheck } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import ChangePasswordForm from "../../components/common/ChangePasswordForm";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useTranslation } from "react-i18next";

export default function AdminSettings() {
  const { t } = useTranslation();
  usePageMeta(t("meta.adminSettings"), "");
  const user = useAuthStore((s) => s.user);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-brand-600" /> {t("adminSettings.account")}
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">{t("adminSettings.name")}</dt>
            <dd className="font-semibold text-slate-800">{user?.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">{t("adminSettings.email")}</dt>
            <dd className="font-semibold text-slate-800">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{t("adminSettings.role")}</dt>
            <dd className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-800">{t("adminSettings.administrator")}</dd>
          </div>
        </dl>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
