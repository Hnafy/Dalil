import { useTranslation } from "react-i18next";
import LoginPage from "../../components/auth/LoginPage";

export default function ManagerLogin() {
  const { t } = useTranslation();
  return (
    <LoginPage
      role="manager"
      title={t("login.managerTitle")}
      subtitle={t("login.managerSubtitle")}
      redirectTo="/manager/dashboard"
    />
  );
}
