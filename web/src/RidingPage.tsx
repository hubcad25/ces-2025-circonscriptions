import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { type CSSProperties, useEffect, useState } from "react";
import RidingChart, { RidingChartAxis } from "./RidingChart";
import { type Category, QUESTIONS } from "./questions";
import QuestionSelect from "./QuestionSelect";
import ridingQuery from "./riding.sql?raw";
import RidingSearch from "./RidingSearch";
import SimilarRidings from "./SimilarRidings";

type Estimate = {
  question: string;
  category: string;
  fed23_name: string;
  province: string;
  estimate_mean: number;
  estimate_low: number;
  estimate_high: number;
  actual_share: number | null;
  national_share: number;
  provincial_share: number | null;
};

const percent = (share: number) => (100 * share).toFixed(1);

async function loadEstimates(con: AsyncDuckDBConnection, fed23: number): Promise<Estimate[]> {
  const statement = await con.prepare(ridingQuery);
  const result = await statement.query(fed23);
  await statement.close();
  return result.toArray().map((row) => row.toJSON() as Estimate);
}

type TableProps = { categories: Category[]; estimates: Estimate[] };

// Every estimate is written on the chart; the table only adds the official result.
function QuestionTable({ categories, estimates }: TableProps) {
  const hasResults = estimates.some((estimate) => estimate.actual_share !== null);
  return (
    <table>
      <thead>
        <tr>
          <th>Answer</th>
          <th>
            Riding estimate and 90% interval (%)
            <RidingChartAxis />
          </th>
          {hasResults && <th className="number">Result %</th>}
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => {
          const estimate = estimates.find((row) => row.category === category.code);
          if (!estimate) return null;
          return (
            <tr key={category.code} style={{ "--party": category.color } as CSSProperties}>
              <td>{category.label}</td>
              <td>
                <RidingChart
                  low={estimate.estimate_low}
                  mean={estimate.estimate_mean}
                  high={estimate.estimate_high}
                  actual={estimate.actual_share}
                  national={estimate.national_share}
                  provincial={estimate.provincial_share}
                  province={estimate.province}
                />
              </td>
              {hasResults && (
                <td className="number">
                  {estimate.actual_share === null ? "no candidate" : percent(estimate.actual_share)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

type Props = { con: AsyncDuckDBConnection; fed23: number };

export default function RidingPage({ con, fed23 }: Props) {
  const [estimates, setEstimates] = useState<Estimate[] | null>(null);
  const [question, setQuestion] = useState(QUESTIONS[0]);
  // Grouped answers are easier to read; questions without groups ignore this choice.
  const [isGrouped, setGrouped] = useState(true);

  useEffect(() => {
    loadEstimates(con, fed23).then(setEstimates);
  }, [con, fed23]);

  if (estimates === null) return <p className="subtitle">Loading riding...</p>;
  if (estimates.length === 0) return <p className="subtitle">Unknown riding {fed23}.</p>;

  return (
    <>
      <div className="riding-nav">
        <a className="back" href="#/">
          ← All ridings
        </a>
        <RidingSearch con={con} />
      </div>
      <h1>{estimates[0].fed23_name}</h1>
      <p className="subtitle">Riding {fed23}, 2023 boundaries.</p>
      <div className="controls">
        <QuestionSelect value={question} onChange={setQuestion} />
        {question.groups && (
          <>
            <span className="spacer" />
            {[true, false].map((option) => (
              <button
                key={String(option)}
                className="wave"
                aria-pressed={option === isGrouped}
                onClick={() => setGrouped(option)}
              >
                {option ? "Grouped" : "Detailed"}
              </button>
            ))}
          </>
        )}
      </div>
      <QuestionTable
        categories={isGrouped && question.groups ? question.groups : question.categories}
        estimates={estimates.filter((estimate) => estimate.question === question.code)}
      />
      <ul className="legend-caption">
        <li>Riding row: the riding's estimate (dot) and its 90% interval (bar), with the official result as a white line for the vote.</li>
        <li>Rows below: the same answer for {estimates[0].province} as a whole (white dot) and for Canada (red maple leaf).</li>
      </ul>
      <SimilarRidings con={con} fed23={fed23} />
    </>
  );
}
