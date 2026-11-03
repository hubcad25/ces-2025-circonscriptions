import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { type CSSProperties, useEffect, useState } from "react";
import EstimateTable, { type Estimate } from "./EstimateTable";
import estimatesQuery from "./estimates.sql?raw";
import FilterControls, { type Filter, matches } from "./filters";
import { OFFICIAL_RESULTS, QUESTIONS } from "./questions";
import resultsQuery from "./results.sql?raw";
import RidingMap from "./RidingMap";

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
  const [category, setCategory] = useState(QUESTIONS[0].categories[0]);
  const [view, setView] = useState<"table" | "map">("map");
  const [filter, setFilter] = useState<Filter>({ province: "", search: "" });
  const [allEstimates, setEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    loadEstimates(con, question.code, category.code).then(setEstimates);
  }, [con, question, category]);

  function chooseQuestion(code: string) {
    const next = QUESTIONS.find((option) => option.code === code)!;
    setQuestion(next);
    setCategory(next.categories[0]);
  }

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
      <div className="controls">
        {question.categories.map((option) => (
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
        <RidingMap ridings={estimates} color={category.color} />
      ) : (
        <EstimateTable estimates={estimates} isOfficial={question.code === OFFICIAL_RESULTS} />
      )}
    </div>
  );
}
