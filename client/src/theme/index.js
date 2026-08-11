export const THEME_KEY = "dalil-theme";
export const THEMES = ["light", "dark", "system"];

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

export function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyDocumentTheme(theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function setStoredTheme(theme) {
  try {
    if (theme === "system") {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, theme);
    }
  } catch {
    // storage unavailable — ignore
  }
}

export function setTheme(theme) {
  applyDocumentTheme(theme);
  setStoredTheme(theme);
}

export function initTheme() {
  applyDocumentTheme(getStoredTheme() ?? "system");
}

export function subscribeSystemTheme(listener) {
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mql?.addEventListener) return () => {};
  const onChange = () => listener(getSystemTheme());
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
