import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";
import App from "./App";
import i18n, { applyDocumentLanguage, getStoredLang } from "./i18n";
import { initTheme } from "./theme";
import "./index.css";

applyDocumentLanguage(getStoredLang());
initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </I18nextProvider>
  </React.StrictMode>
);
