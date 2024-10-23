import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { TRANSLATIONS_JA } from "./ja/translations";
import { TRANSLATIONS_EN } from "./en/translations";
import { TRANSLATIONS_PT } from "./pt/translations";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: TRANSLATIONS_EN,
      },
      ja: {
        translation: TRANSLATIONS_JA,
      },
      pt: {
        translation: TRANSLATIONS_PT,
      },
    },
    fallbackLng: "en",
  });

export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang);
}
