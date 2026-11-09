import { createContext, useContext } from "react";

export type Lang = "en" | "fr";

// Text shown in both languages, for labels stored in data such as the questions.
export type Text = { en: string; fr: string };

const STORAGE_KEY = "lang";

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "fr") return saved;
  } catch {
    // Storage can be blocked (private window); fall back to the browser language.
  }
  return navigator.language.startsWith("fr") ? "fr" : "en";
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // The choice then only lasts for this visit.
  }
  document.documentElement.lang = lang;
}

export const LangContext = createContext<Lang>("en");

// Components write each string in both languages side by side: t("Explore", "Explorer").
export function useLang() {
  const lang = useContext(LangContext);
  const t = (en: string, fr: string) => (lang === "fr" ? fr : en);
  return { lang, t };
}
