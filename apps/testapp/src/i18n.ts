import i18n from "i18next";
import { initReactI18next } from "react-i18next";

void i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: ["translation", "table"],
  defaultNS: "translation",
  resources: {
    en: {
      translation: {},
      table: {},
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
