import { useTranslation } from "react-i18next";

export default function Spinner({ size = "md", className = "" }) {
  const { t } = useTranslation();
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
  return (
    <span className={`inline-flex ${className}`} role="status" aria-label={t("common.loading")}>
      <span className={`${sizes[size]} animate-spin rounded-full border-2 border-brand-500 border-t-transparent`} />
    </span>
  );
}
