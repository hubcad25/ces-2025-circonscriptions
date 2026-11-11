import { type CSSProperties, useEffect, useState } from "react";
import { loadValidation } from "./data";
import FilterControls, { type Filter, matches } from "./filters";
import { type Text, useLang } from "./i18n";
import { PARTIES } from "./parties";
import RidingTable, { type Riding } from "./RidingTable";
import SurveyMeansTable from "./SurveyMeansTable";

const WAVES: { code: string; label: Text }[] = [
  { code: "vote_post", label: { en: "Reported vote", fr: "Vote déclaré" } },
  { code: "vote_pre", label: { en: "Vote intention", fr: "Intention de vote" } },
];

export default function ValidationPage() {
  const { lang, t } = useLang();
  const [wave, setWave] = useState(WAVES[0].code);
  const [party, setParty] = useState(PARTIES[0]);
  const [filter, setFilter] = useState<Filter>({ province: "", search: "" });
  const [allRidings, setRidings] = useState<Riding[]>([]);

  useEffect(() => {
    loadValidation(wave, party.code).then(setRidings);
  }, [wave, party]);

  const ridings = allRidings.filter((riding) => matches(riding, filter));
  const covered = ridings.filter((riding) => riding.is_covered).length;
  const meanGap = ridings.reduce((sum, riding) => sum + Math.abs(riding.gap), 0) / ridings.length;

  return (
    <div style={{ "--party": party.color } as CSSProperties}>
      <h1>{t("Model validation on the 2025 vote", "Validation du modèle sur le vote de 2025")}</h1>
      <p className="subtitle">
        {t(
          "MRP estimates from the Canadian Election Study, compared with the official results. Use it to see where the model is reliable before reading the estimates of a riding.",
          "Estimations MRP tirées de l'Étude électorale canadienne, comparées aux résultats officiels. Pour voir où le modèle est fiable avant de lire les estimations d'une circonscription.",
        )}
      </p>
      <div className="controls">
        {WAVES.map((option) => (
          <button
            key={option.code}
            className="wave"
            aria-pressed={option.code === wave}
            onClick={() => setWave(option.code)}
          >
            {option.label[lang]}
          </button>
        ))}
      </div>
      <div className="controls">
        {PARTIES.map((option) => (
          <button
            key={option.code}
            aria-pressed={option.code === party.code}
            onClick={() => setParty(option)}
          >
            {option.label[lang]}
          </button>
        ))}
        <FilterControls filter={filter} onChange={setFilter} />
      </div>
      {ridings.length === 0 ? (
        <p className="stats">{t("No riding matches.", "Aucune circonscription ne correspond.")}</p>
      ) : (
        <>
          <p className="stats">
            <strong>{ridings.length}</strong> {t("ridings", "circonscriptions")} ·{" "}
            {t("mean absolute gap", "écart absolu moyen")}{" "}
            <strong>{(100 * meanGap).toFixed(1)} pts</strong> ·{" "}
            <strong>{Math.round((100 * covered) / ridings.length)} %</strong>{" "}
            {t("of results within the 90% interval", "des résultats dans l'intervalle à 90 %")}
          </p>
          <RidingTable ridings={ridings} />
          <p className="note">
            {t(
              "Bar: 90% interval of the estimate, widened by a factor calibrated on the reported vote; dot: estimate; line: official result. Gap = estimate minus result: red when the model overestimates, blue when it underestimates.",
              "Barre : intervalle à 90 % de l'estimation, élargi par un facteur calibré sur le vote déclaré ; point : estimation ; trait : résultat officiel. Écart = estimation moins résultat : rouge quand le modèle surestime, bleu quand il sous-estime.",
            )}
          </p>
        </>
      )}
      <SurveyMeansTable />
    </div>
  );
}
