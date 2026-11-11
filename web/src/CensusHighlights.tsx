import type { Census } from "./data";
import { type Text, useLang } from "./i18n";

// Each trait names a group of people, so that "More" or "Fewer" reads as a sentence. The French
// names carry their "de" or "d'", which depends on the next word.
const TRAITS: Record<string, Text> = {
  age_65_plus: { en: "people aged 65 and over", fr: "de personnes de 65 ans et plus" },
  age_under_15: { en: "children under 15", fr: "d'enfants de moins de 15 ans" },
  bachelor: { en: "university graduates aged 25 to 64", fr: "de diplômés universitaires de 25 à 64 ans" },
  french: { en: "people with French as mother tongue", fr: "de personnes de langue maternelle française" },
  english: { en: "people with English as mother tongue", fr: "de personnes de langue maternelle anglaise" },
  other_language: {
    en: "people whose mother tongue is neither English nor French",
    fr: "de personnes dont la langue maternelle n'est ni le français ni l'anglais",
  },
  immigrants: { en: "immigrants", fr: "d'immigrants" },
  visible_minority: { en: "visible minorities", fr: "de personnes de minorités visibles" },
  indigenous: { en: "Indigenous people", fr: "d'Autochtones" },
  low_income: { en: "people with low income", fr: "de personnes à faible revenu" },
  owners: { en: "homeowner households", fr: "de ménages propriétaires" },
};

const percent = (share: number) => `${Math.round(100 * share)}%`;

type Props = { census: Census; provinceName: string };

// The census traits of the riding's population that stand out (census_highlights.sql): first
// against the province, then against Canada. A territory only has the comparison with Canada.
export default function CensusHighlights({ census, provinceName }: Props) {
  const { lang, t } = useLang();
  const rows = [
    ...(census.province ?? []).map((trait) => ({ trait, reference: provinceName })),
    ...(census.canada ?? []).map((trait) => ({ trait, reference: "Canada" })),
  ];
  return (
    <div className="census">
      <h3>{t("Population", "Population")}</h3>
      {rows.length === 0 ? (
        <p className="subtitle">{t("No clear difference.", "Aucun écart net.")}</p>
      ) : (
        <ul className="census-list">
          {rows.map(({ trait: [trait, share, referenceShare], reference }) => (
            <li key={`${reference}-${trait}`}>
              <strong>{share > referenceShare ? t("More", "Plus") : t("Fewer", "Moins")}</strong>{" "}
              {TRAITS[trait][lang]}{" "}
              <span className="muted">
                ({percent(share)} · {reference} {percent(referenceShare)})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
