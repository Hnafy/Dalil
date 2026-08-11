import { useTranslation } from "react-i18next";
import LoginPage from "../../components/auth/LoginPage";

export default function AdminLogin() {
  const { t } = useTranslation();
  return (
    <LoginPage
      role="admin"
      title={t("login.adminTitle")}
      subtitle={t("login.adminSubtitle")}
      redirectTo="/admin/dashboard"
    />
  );
}
