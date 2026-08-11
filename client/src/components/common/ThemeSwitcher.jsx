import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import {
  applyDocumentTheme,
  getStoredTheme,
  getSystemTheme,
  setStoredTheme,
  subscribeSystemTheme,
} from "../../theme";

function resolveTheme() {
  return getStoredTheme() ?? getSystemTheme();
}

export default function ThemeSwitcher({ variant = "light" }) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(resolveTheme);
  const light = variant === "light";
  const dark = theme === "dark";

  useEffect(() => {
    const unsubscribe = subscribeSystemTheme(() => {
      if (getStoredTheme()) return;
      setTheme(getSystemTheme());
      applyDocumentTheme("system");
    });
    return unsubscribe;
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setStoredTheme(next);
    applyDocumentTheme(next);
  };

  const container = light
    ? "inline-flex items-center rounded-xl border border-slate-200 bg-surface"
    : "inline-flex items-center rounded-xl bg-white/10 ring-1 ring-white/20";
  const label = light
    ? "text-slate-600 hover:bg-slate-50"
    : "text-white hover:bg-white/10";

  return (
    <div className={container}>
      <button
        type="button"
        onClick={toggle}
        aria-label={t("theme.switch")}
        title={dark ? t("theme.light") : t("theme.dark")}
        className={`rounded-lg px-3 py-1.5 transition ${label}`}
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
