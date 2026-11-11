import { useEffect, useState } from "react";
import { loadSurveyMeans, type SurveyMean } from "./data";
import { useLang } from "./i18n";
import { PARTIES } from "./parties";
import { QUESTIONS } from "./questions";

// Ordinal questions are compared on their mean position on the scale, the vote on shares.
const format = (row: SurveyMean, value: number) =>
  row.category === "mean" ? value.toFixed(2) : `${(100 * value).toFixed(1)}%`;

function formatGap(row: SurveyMean): string {
  const gap = row.model_mean - row.weighted_mean;
  const sign = gap > 0 ? "+" : gap < 0 ? "−" : "";
  return row.category === "mean"
    ? `${sign}${Math.abs(gap).toFixed(2)}`
    : `${sign}${(100 * Math.abs(gap)).toFixed(1)} pts`;
}

// The model's national estimate of each question next to the survey's own means, raw and weighted.
export default function SurveyMeansTable() {
  const { lang, t } = useLang();
  const [rows, setRows] = useState<SurveyMean[]>([]);

  useEffect(() => {
    loadSurveyMeans().then(setRows);
  }, []);

  const label = (row: SurveyMean) => {
    const question = QUESTIONS.find((candidate) => candidate.code === row.question);
    const party = PARTIES.find((candidate) => candidate.code === row.category);
    const name = question?.label[lang] ?? row.question;
    return party ? `${name} · ${party.label[lang]}` : name;
  };

  return (
    <section>
      <h2>{t("National estimates against the survey", "Estimations nationales et sondage")}</h2>
      <p className="subtitle">
        {t(
          "The model's estimate for Canada next to the survey's own average: raw (each respondent counts once) and with the CES weights. A question asked in Quebec only is compared within Quebec.",
          "L'estimation du modèle pour le Canada à côté de la moyenne du sondage : brute (chaque répondant compte une fois) et avec les poids du CES. Une question posée au Québec seulement est comparée au Québec.",
        )}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("Question", "Question")}</th>
              <th className="number">{t("Model", "Modèle")}</th>
              <th className="number">{t("Raw", "Brute")}</th>
              <th className="number">{t("Weighted", "Pondérée")}</th>
              <th className="number">{t("Gap", "Écart")}</th>
              <th className="number">{t("Official result", "Résultat officiel")}</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].sort((a, b) => label(a).localeCompare(label(b), lang)).map((row) => (
              <tr key={`${row.question}-${row.category}`}>
                <td>{label(row)}</td>
                <td className="number">{format(row, row.model_mean)}</td>
                <td className="number">{format(row, row.raw_mean)}</td>
                <td className="number">{format(row, row.weighted_mean)}</td>
                <td className="number">{formatGap(row)}</td>
                <td className="number">
                  {row.official_share == null ? "" : format(row, row.official_share)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        {t(
          "Gap: model minus weighted average. Mean positions run from 1 (first answer) to the number of answers. The model also uses the 2021 vote to correct the survey's political bias.",
          "Écart : modèle moins moyenne pondérée. Les positions moyennes vont de 1 (première réponse) au nombre de réponses. Le modèle utilise aussi le vote de 2021 pour corriger le biais politique du sondage.",
        )}
      </p>
    </section>
  );
}
