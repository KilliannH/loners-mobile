import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

const deviceLang = RNLocalize.getLocales()[0]?.languageTag ?? "fr-FR";

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    lng: deviceLang,
    fallbackLng: "fr",
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    interpolation: { escapeValue: false }
  });

export default i18n;