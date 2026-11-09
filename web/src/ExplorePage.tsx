import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import EstimateTable, { type Estimate } from "./EstimateTable";
import estimatesQuery from "./estimates.sql?raw";
import FilterControls, { type Filter, matches } from "./filters";
import { type Text, useLang } from "./i18n";
import { provinceLabel } from "./provinces";
import { type Category, DEFAULT_QUESTION, HIGH, OFFICIAL_RESULTS, type Question } from "./questions";
import QuestionSelect from "./QuestionSelect";
import resultsQuery from "./results.sql?raw";
import RidingMap from "./RidingMap";

type Display = "grouped" | "detailed" | "canada";

// The "canada" display is labelled with its reference, Canada or the chosen province.
const DISPLAY_LABELS: Record<Exclude<Display, "canada">, Text> = {
  grouped: { en: "Grouped", fr: "Regroupé" },
  detailed: { en: "Detailed", fr: "Détaillé" },
};

// "vs Canada" compares each riding's mean answer with the national mean, or the provincial
// mean when a province is chosen.
function displays(question: Question): Display[] {
  if (!question.isOrdinal) return ["detailed"];
  return question.groups ? ["canada", "grouped", "detailed"] : ["canada", "detailed"];
}

// An ordinal question opens on its comparison with Canada; the others on their shares.
const defaultDisplay = (question: Question): Display =>
  question.isOrdinal ? "canada" : "detailed";

function displayCategories(question: Question, display: Display): Category[] {
  if (display === "canada") return [{ code: "mean", label: { en: "Mean answer", fr: "Réponse moyenne" }, color: HIGH }];
  if (display === "grouped") return question.groups!;
  return question.categories;
}

async function loadEstimates(
  con: AsyncDuckDBConnection,
  question: string,
  category: string,
): Promise<Estimate[]> {
  const isOfficial = question === OFFICIAL_RESULTS;
  const statement = await con.prepare(isOfficial ? resultsQuery : estimatesQuery);
  const result = isOfficial
    ? await statement.query(category)
    : await statement.query(question, category);
  await statement.close();
  return result.toArray().map((row) => row.toJSON() as Estimate);
}

export default function ExplorePage({ con }: { con: AsyncDuckDBConnection }) {
  const { lang, t } = useLang();
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [display, setDisplay] = useState<Display>(() => defaultDisplay(DEFAULT_QUESTION));
  // A function, so that the first category is only computed once: with the current display
  // and the default question, it would fail once the display moves to "grouped".
  const [category, setCategory] = useState(
    () => displayCategories(DEFAULT_QUESTION, defaultDisplay(DEFAULT_QUESTION))[0],
  );
  const [view, setView] = useState<"table" | "map">("map");
  const [filter, setFilter] = useState<Filter>({ province: "", search: "" });
  const [allEstimates, setEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    loadEstimates(con, question.code, category.code).then(setEstimates);
  }, [con, question, category]);

  // A new question or display starts on its first category.
  function choose(nextQuestion: Question, nextDisplay: Display) {
    setQuestion(nextQuestion);
    setDisplay(nextDisplay);
    setCategory(displayCategories(nextQuestion, nextDisplay)[0]);
  }

  // Ridings are compared with their province when one is chosen, with Canada otherwise.
  const referenceName = filter.province ? provinceLabel(filter.province, lang) : "Canada";
  const reference = filter.province
    ? allEstimates.find((estimate) => estimate.province === filter.province)?.provincial
    : allEstimates[0]?.national;

  // Memoized so that the map only redraws when the display or the data really change.
  const comparison = useMemo(
    () =>
      display === "canada" && reference != null
        ? {
            reference,
            referenceName,
            scaleLabels: question.categories.map((option) => option.label[lang]),
            ends: [question.ends![0][lang], question.ends![1][lang]] as [string, string],
          }
        : undefined,
    [display, question, reference, referenceName, lang],
  );

  const estimates = allEstimates.filter((estimate) => matches(estimate, filter));

  const categories = displayCategories(question, display);

  return (
    <div className="explore" style={{ "--party": category.color } as CSSProperties}>
      <div className="toolbar">
        <p className="intro">
          {t(
            "Estimates for all 343 ridings, from the 2025 Canadian Election Study.",
            "Estimations pour les 343 circonscriptions, d'après l'Étude électorale canadienne 2025.",
          )}{" "}
          <a href="#/about">{t("How it works →", "Comment ça marche →")}</a>
        </p>
        <div className="controls">
          <QuestionSelect value={question} onChange={(next) => choose(next, defaultDisplay(next))} />
          <span className="spacer" />
          <div className="segmented">
            {(["map", "table"] as const).map((option) => (
              <button
                key={option}
                className="wave"
                aria-pressed={option === view}
                onClick={() => setView(option)}
              >
                {option === "map" ? t("Map", "Carte") : t("Table", "Tableau")}
              </button>
            ))}
          </div>
        </div>
        <div className="controls">
          {displays(question).length > 1 && (
            <div className="segmented">
              {displays(question).map((option) => (
                <button
                  key={option}
                  className="wave"
                  aria-pressed={option === display}
                  onClick={() => choose(question, option)}
                >
                  {option === "canada"
                    ? t(`Average vs ${referenceName}`, `Moyenne vs ${referenceName}`)
                    : DISPLAY_LABELS[option][lang]}
                </button>
              ))}
            </div>
          )}
          {categories.length > 1 &&
            categories.map((option) => (
              <button
                key={option.code}
                aria-pressed={option.code === category.code}
                onClick={() => setCategory(option)}
              >
                {option.label[lang]}
              </button>
            ))}
          <span className="spacer" />
          <FilterControls filter={filter} onChange={setFilter} />
        </div>
      </div>
      <div className="explore-body">
        {allEstimates.length === 0 ? (
          <p className="stats">{t("Loading...", "Chargement...")}</p>
        ) : estimates.length === 0 ? (
          <p className="stats">{t("No riding matches.", "Aucune circonscription ne correspond.")}</p>
        ) : view === "map" ? (
          <RidingMap
            ridings={estimates}
            color={category.color}
            comparison={comparison}
          />
        ) : (
          <EstimateTable
            estimates={estimates}
            isOfficial={question.code === OFFICIAL_RESULTS}
            topRank={display === "canada" ? question.categories.length : undefined}
          />
        )}
      </div>
    </div>
  );
}
