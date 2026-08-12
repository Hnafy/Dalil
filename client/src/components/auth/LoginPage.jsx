import { useEffect, useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { MapPinned, Eye, EyeOff, LogIn } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import Spinner from "../common/Spinner";
import { useTranslation } from "react-i18next";
import logo from '../../img/logo.png'

export default function LoginPage({ role, title, subtitle, redirectTo }) {
  const navigate = useNavigate();
  const { login, user, status } = useAuthStore();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isCorrectRole = user?.role === role;

  useEffect(() => {
    if (user && isCorrectRole) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, isCorrectRole, navigate, redirectTo]);

  if (user && !isCorrectRole) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/manager/dashboard"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(role, form);
      toast.success(t("login.welcomeBack"));
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.safeMessage || t("login.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-11 w-11">
            <img src={logo} alt="logo" />
          </span>
          <span className="text-2xl font-extrabold text-white">
            Dalil
          </span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("login.emailPlaceholder")}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                {t("login.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input !pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={t(showPassword ? "login.hidePassword" : "login.showPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Spinner size="sm" /> : <LogIn className="h-4 w-4" />}
              {t("login.signIn")}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-brand-100">
          <Link to="/" className="font-semibold text-white underline-offset-4 hover:underline">
            {t("login.backToDirectory")}
          </Link>
        </p>
      </div>
    </div>
  );
}
