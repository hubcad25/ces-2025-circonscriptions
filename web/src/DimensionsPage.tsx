import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { type DimensionData, loadDimension } from "./data";
import { DIMENSIONS, LEFT, RIGHT } from "./dimensions";
import FilterControls, { type Filter, matches } from "./filters";
import { useLang } from "./i18n";
import { provinceLabel } from "./provinces";
import { QUESTIONS } from "./questions";
import RidingMap from "./RidingMap";

// Below this loading, an attitude barely moves with the dimension: it is shown faded.
const WEAK_LOADING = 0.3;

// Every attitude, from the strongest loading to the weakest, whatever its side. Each is read
// as the high end of its scale, in the middle, with its bar on the side of the end it goes with.
// A loading of 1 fills three quarters of its side, which leaves room for the value.
function Loadings({ loadings, ends }: { loadings: [string, number][]; ends: [string, string] }) {
  const { lang } = useLang();
  const sorted = [...loadings].sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
  return (
    <div className="loadings">
      <div className="loadings-ends">
        <span style={{ color: LEFT }}>← {ends[0]}</span>
        <span style={{ color: RIGHT }}>{ends[1]} →</span>
      </div>
      <ul>
        {sorted.map(([code, loading]) => {
          const question = QUESTIONS.find((candidate) => candidate.code === code)!;
          const bar = (
            <>
              <span className="loading-bar" style={{ width: `${75 * Math.abs(loading)}%` }} />
              <span className="loading-value">{Math.abs(loading).toFixed(2)}</span>
            </>
          );
          return (
            <li
              key={code}
              className={Math.abs(loading) < WEAK_LOADING ? "weak" : undefined}
              title={question.label[lang]}
              style={{ "--party": loading < 0 ? LEFT : RIGHT } as CSSProperties}
            >
              <span className="loading-side left">{loading < 0 && bar}</span>
              <span className="loading-statement">{question.statement![lang]}</span>
              <span className="loading-side right">{loading > 0 && bar}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function DimensionsPage() {
  const { lang, t } = useLang();
  const [dimension, setDimension] = useState(DIMENSIONS[0]);
  const [data, setData] = useState<DimensionData | null>(null);
  const [filter, setFilter] = useState<Filter>({ province: "", search: "" });

  useEffect(() => {
    loadDimension(dimension.code).then(setData);
  }, [dimension]);

  // Ridings are compared with their province when one is chosen, with Canada otherwise.
  const allRidings = data?.ridings ?? [];
  const referenceName = filter.province ? provinceLabel(filter.province, lang) : "Canada";
  const reference = filter.province
    ? allRidings.find((riding) => riding.province === filter.province)?.provincial
    : allRidings[0]?.national;

  // Memoized so that the map only redraws when the dimension, the reference or the language change.
  const comparison = useMemo(
    () =>
      reference != null
        ? {
            reference,
            referenceName,
            ends: [dimension.ends[0][lang], dimension.ends[1][lang]] as [string, string],
            colors: [LEFT, RIGHT] as [string, string],
          }
        : undefined,
    [reference, referenceName, dimension, lang],
  );

  const ridings = allRidings.filter((riding) => matches(riding, filter));

  return (
    <div className="dimensions">
      <div className="toolbar">
        <p className="intro">
          {t(
            "41 attitudes summed up in one left-right axis and 5 dimensions. A higher score leans to the right.",
            "41 attitudes résumées en un axe gauche-droite et 5 dimensions. Un score plus élevé penche à droite.",
          )}
        </p>
        <div className="controls">
          {DIMENSIONS.map((option) => (
            <button
              key={option.code}
              aria-pressed={option.code === dimension.code}
              onClick={() => setDimension(option)}
            >
              {option.label[lang]}
            </button>
          ))}
          <span className="spacer" />
          <FilterControls filter={filter} onChange={setFilter} />
        </div>
      </div>
      {/* The side column is there from the first render: the map must not be created in its place
          and keep that narrower view once the data loads. */}
      <div className="dimensions-body">
        <div className="dimensions-side">
          <Loadings
            loadings={data?.loadings ?? []}
            ends={[dimension.ends[0][lang], dimension.ends[1][lang]]}
          />
          <div className="about">
            <h2>{t("Method", "Méthode")}</h2>
            <ul>
              <li>
                {t(
                  "Principal component analysis of the answers of about 20,000 respondents. The first component, which alone accounts for 21% of the variation in answers, is the left-right axis.",
                  "Analyse en composantes principales des réponses d'environ 20 000 répondants. La première composante, qui explique à elle seule 21 % de la variation des réponses, est l'axe gauche-droite.",
                )}
              </li>
              <li>
                {t(
                  "A varimax rotation of the first five components gives the other dimensions, each grouping a few questions. Sign chosen so that + = right.",
                  "Une rotation varimax des cinq premières composantes donne les autres dimensions, qui regroupent chacune quelques questions. Signe choisi pour que + = droite.",
                )}
              </li>
              <li>
                {t(
                  "A riding's score combines its estimated answers (see About) with the weights of the analysis, for each of the model's 100 draws, which gives its 90% interval.",
                  "Le score d'une circonscription combine ses réponses estimées (voir À propos) avec les poids de l'analyse, pour chacun des 100 tirages du modèle, ce qui donne son intervalle à 90 %.",
                )}
              </li>
            </ul>
          </div>
        </div>
        <div className="dimension-map">
          <RidingMap ridings={ridings} color={RIGHT} comparison={comparison} />
        </div>
      </div>
    </div>
  );
}
