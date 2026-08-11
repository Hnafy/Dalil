import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import Spinner from "../components/common/Spinner";
import { useTranslation } from "react-i18next";

export function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-slate-500">{t("common.loading")}</p>
    </div>
  );
}

export function AdminRoute({ children }) {
  const { user, status, fetchMe } = useAuthStore();

  useEffect(() => {
    if (status === "loading") fetchMe();
  }, [status, fetchMe]);

  if (status === "loading") return <LoadingScreen />;
  if (!user || user.role !== "admin") return <Navigate to="/admin/login" replace />;
  return children;
}

export function ManagerRoute({ children }) {
  const { user, status, fetchMe } = useAuthStore();

  useEffect(() => {
    if (status === "loading") fetchMe();
  }, [status, fetchMe]);

  if (status === "loading") return <LoadingScreen />;
  if (!user || user.role !== "manager") return <Navigate to="/manager/login" replace />;
  return children;
}
