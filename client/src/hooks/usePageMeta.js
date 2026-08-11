import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function usePageMeta(title, description) {
  const { t } = useTranslation();
  const fallback = t("meta.homeTitle");

  useEffect(() => {
    document.title = title || fallback;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    return () => {
      document.title = t("meta.homeTitle");
    };
  }, [title, description, fallback, t]);
}
