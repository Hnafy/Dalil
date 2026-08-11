import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { changePassword } from "../../services/authService";
import Spinner from "./Spinner";
import { useTranslation } from "react-i18next";

export default function ChangePasswordForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) {
      toast.warning(t("changePassword.lengthWarning"));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.warning(t("changePassword.mismatchWarning"));
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success(t("changePassword.success"));
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.safeMessage || t("changePassword.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card max-w-lg p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
        <KeyRound className="h-5 w-5 text-brand-600" /> {t("changePassword.title")}
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="current" className="label">
            {t("changePassword.current")}
          </label>
          <input
            id="current"
            type="password"
            autoComplete="current-password"
            required
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="new" className="label">
            {t("changePassword.new")}
          </label>
          <div className="relative">
            <input
              id="new"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="input !pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={t(show ? "login.hidePassword" : "login.showPassword")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            {t("changePassword.confirm")}
          </label>
          <input
            id="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="input"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting && <Spinner size="sm" />}
          {t("changePassword.update")}
        </button>
      </div>
    </form>
  );
}
