import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const LANG_KEY = "dalil-lang";
export const DEFAULT_LANG = "ar";

export function getStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === "en" ? "en" : stored === "ar" ? "ar" : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function setStoredLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // storage unavailable — ignore
  }
}

export function applyDocumentLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

export function changeLanguage(lang) {
  applyDocumentLanguage(lang);
  setStoredLang(lang);
  return i18n.changeLanguage(lang);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: getStoredLang(),
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

export default i18n;
