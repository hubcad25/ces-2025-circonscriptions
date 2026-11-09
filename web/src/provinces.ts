import type { Lang, Text } from "./i18n";

// West to east, then the territories, as in most Canadian tables. Codes come from the data.
export const PROVINCES: { code: string; label: Text; name: Text }[] = [
  {
    code: "BC",
    label: { en: "BC", fr: "C.-B." },
    name: { en: "British Columbia", fr: "Colombie-Britannique" },
  },
  {
    code: "AB",
    label: { en: "AB", fr: "Alb." },
    name: { en: "Alberta", fr: "Alberta" },
  },
  {
    code: "SK",
    label: { en: "SK", fr: "Sask." },
    name: { en: "Saskatchewan", fr: "Saskatchewan" },
  },
  {
    code: "MB",
    label: { en: "MB", fr: "Man." },
    name: { en: "Manitoba", fr: "Manitoba" },
  },
  {
    code: "ON",
    label: { en: "ON", fr: "Ont." },
    name: { en: "Ontario", fr: "Ontario" },
  },
  {
    code: "QC",
    label: { en: "QC", fr: "Qc" },
    name: { en: "Quebec", fr: "Québec" },
  },
  {
    code: "NB",
    label: { en: "NB", fr: "N.-B." },
    name: { en: "New Brunswick", fr: "Nouveau-Brunswick" },
  },
  {
    code: "NS",
    label: { en: "NS", fr: "N.-É." },
    name: { en: "Nova Scotia", fr: "Nouvelle-Écosse" },
  },
  {
    code: "PE",
    label: { en: "PE", fr: "Î.-P.-É." },
    name: { en: "Prince Edward Island", fr: "Île-du-Prince-Édouard" },
  },
  {
    code: "NL",
    label: { en: "NL", fr: "T.-N.-L." },
    name: { en: "Newfoundland and Labrador", fr: "Terre-Neuve-et-Labrador" },
  },
  {
    code: "YT",
    label: { en: "YT", fr: "Yn" },
    name: { en: "Yukon", fr: "Yukon" },
  },
  {
    code: "NT",
    label: { en: "NT", fr: "T.N.-O." },
    name: { en: "Northwest Territories", fr: "Territoires du Nord-Ouest" },
  },
  {
    code: "NU",
    label: { en: "NU", fr: "Nt" },
    name: { en: "Nunavut", fr: "Nunavut" },
  },
];

export const provinceLabel = (code: string, lang: Lang) =>
  PROVINCES.find((province) => province.code === code)?.label[lang] ?? code;

export const provinceName = (code: string, lang: Lang) =>
  PROVINCES.find((province) => province.code === code)?.name[lang] ?? code;
