import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { type CSSProperties, useEffect, useState } from "react";
import IntervalBar, { IntervalAxis } from "./IntervalBar";
import { type Question, QUESTIONS } from "./questions";
import QuestionSelect from "./QuestionSelect";
import ridingQuery from "./riding.sql?raw";

type Estimate = {
  question: string;
  category: string;
  fed23_name: string;
  estimate_mean: number;
  estimate_low: number;
  estimate_high: number;
  actual_share: number | null;
  national_share: number;
};

const percent = (share: number) => (100 * share).toFixed(1);

async function loadEstimates(con: AsyncDuckDBConnection, fed23: number): Promise<Estimate[]> {
  const statement = await con.prepare(ridingQuery);
  const result = await statement.query(fed23);
  await statement.close();
  return result.toArray().map((row) => row.toJSON() as Estimate);
}

type TableProps = { question: Question; estimates: Estimate[] };

function QuestionTable({ question, estimates }: TableProps) {
  const hasResults = estimates.some((estimate) => estimate.actual_share !== null);
  return (
    <table>
      <thead>
        <tr>
          <th>Answer</th>
          <th className="center">MRP %</th>
          <th className="number">Canada %</th>
          {hasResults && <th className="number">Result %</th>}
          <th>
            90% interval{hasResults && " and result"} (%)
            <IntervalAxis />
          </th>
        </tr>
      </thead>
      <tbody>
        {question.categories.map((category) => {
          const estimate = estimates.find((row) => row.category === category.code);
          if (!estimate) return null;
          return (
            <tr key={category.code} style={{ "--party": category.color } as CSSProperties}>
              <td>{category.label}</td>
              <td>
                <div className="estimate">
                  <span className="bound">{percent(estimate.estimate_low)}</span>
                  <span>{percent(estimate.estimate_mean)}</span>
                  <span className="bound">{percent(estimate.estimate_high)}</span>
                </div>
              </td>
              <td className="number national-value">{percent(estimate.national_share)}</td>
              {hasResults && (
                <td className="number">
                  {estimate.actual_share === null ? "no candidate" : percent(estimate.actual_share)}
                </td>
              )}
              <td>
                <IntervalBar
                  low={estimate.estimate_low}
                  mean={estimate.estimate_mean}
                  high={estimate.estimate_high}
                  actual={estimate.actual_share}
                  national={estimate.national_share}
                />
              </td>
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

  useEffect(() => {
    loadEstimates(con, fed23).then(setEstimates);
  }, [con, fed23]);

  if (estimates === null) return <p className="subtitle">Loading riding...</p>;
  if (estimates.length === 0) return <p className="subtitle">Unknown riding {fed23}.</p>;

  return (
    <>
      <a className="back" href="#/">
        ← All ridings
      </a>
      <h1>{estimates[0].fed23_name}</h1>
      <p className="subtitle">Riding {fed23}, 2023 boundaries.</p>
      <div className="controls">
        <QuestionSelect value={question} onChange={setQuestion} />
      </div>
      <QuestionTable
        question={question}
        estimates={estimates.filter((estimate) => estimate.question === question.code)}
      />
      <p className="note">
        Bar: 90% interval of the riding estimate; dot: riding estimate; diamond: Canada; line:
        official result.
      </p>
    </>
  );
}
