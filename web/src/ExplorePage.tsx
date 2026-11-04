import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import EstimateTable, { type Estimate } from "./EstimateTable";
import estimatesQuery from "./estimates.sql?raw";
import FilterControls, { type Filter, matches } from "./filters";
import { type Category, HIGH, OFFICIAL_RESULTS, type Question, QUESTIONS } from "./questions";
import resultsQuery from "./results.sql?raw";
import RidingMap from "./RidingMap";

type Display = "grouped" | "detailed" | "canada";

const DISPLAY_LABELS: Record<Display, string> = {
  grouped: "Grouped",
  detailed: "Detailed",
  canada: "vs Canada",
};

// "vs Canada" compares each riding's mean answer with the national mean.
function displays(question: Question): Display[] {
  if (!question.isOrdinal) return ["detailed"];
  return question.groups ? ["grouped", "canada", "detailed"] : ["canada", "detailed"];
}

// An ordinal question opens on its comparison with Canada; the others on their shares.
const defaultDisplay = (question: Question): Display =>
  question.isOrdinal ? "canada" : "detailed";

function displayCategories(question: Question, display: Display): Category[] {
  if (display === "canada") return [{ code: "mean", label: "Mean answer", color: HIGH }];
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
  const [question, setQuestion] = useState(QUESTIONS[0]);
  const [display, setDisplay] = useState<Display>(() => defaultDisplay(QUESTIONS[0]));
  // A function, so that the first category is only computed once: with the current display
  // and the first question, it would fail once the display moves to "grouped".
  const [category, setCategory] = useState(
    () => displayCategories(QUESTIONS[0], defaultDisplay(QUESTIONS[0]))[0],
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

  function chooseQuestion(code: string) {
    const next = QUESTIONS.find((option) => option.code === code)!;
    choose(next, defaultDisplay(next));
  }

  // Memoized so that the map only redraws when the display or the data really change.
  const national = allEstimates[0]?.national;
  const comparison = useMemo(
    () =>
      display === "canada" && national != null
        ? { national, scaleLabels: question.categories.map((option) => option.label) }
        : undefined,
    [display, question, national],
  );

  const estimates = allEstimates.filter((estimate) => matches(estimate, filter));

  return (
    <div style={{ "--party": category.color } as CSSProperties}>
      <h1>Explore the estimates</h1>
      <p className="subtitle">MRP estimates by riding from the Canadian Election Study.</p>
      <div className="controls">
        <select value={question.code} onChange={(event) => chooseQuestion(event.target.value)}>
          {QUESTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="spacer" />
        {(["map", "table"] as const).map((option) => (
          <button
            key={option}
            className="wave"
            aria-pressed={option === view}
            onClick={() => setView(option)}
          >
            {option === "map" ? "Map" : "Table"}
          </button>
        ))}
      </div>
      {displays(question).length > 1 && (
        <div className="controls">
          {displays(question).map((option) => (
            <button
              key={option}
              className="wave"
              aria-pressed={option === display}
              onClick={() => choose(question, option)}
            >
              {DISPLAY_LABELS[option]}
            </button>
          ))}
        </div>
      )}
      <div className="controls">
        {displayCategories(question, display).map((option) => (
          <button
            key={option.code}
            aria-pressed={option.code === category.code}
            onClick={() => setCategory(option)}
          >
            {option.label}
          </button>
        ))}
        <FilterControls filter={filter} onChange={setFilter} />
      </div>
      {estimates.length === 0 ? (
        <p className="stats">No riding matches.</p>
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
  );
}
