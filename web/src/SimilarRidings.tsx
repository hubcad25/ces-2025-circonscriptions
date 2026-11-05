import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { useEffect, useState } from "react";
import { PARTIES } from "./parties";
import { QUESTIONS } from "./questions";
import namesQuery from "./riding_names.sql?raw";
import { loadFeatures, nearestRidings, type RidingFeatures } from "./similar";

const ATTITUDES = QUESTIONS.filter((question) => question.isOrdinal);
const VOTE = "vote";
const NEIGHBOUR_COUNT = 10;

// One slider per attitude, plus one for the official 2025 vote (off by default).
const DEFAULT_WEIGHTS: Record<string, number> = {
  ...Object.fromEntries(ATTITUDES.map((question) => [question.code, 1])),
  [VOTE]: 0,
};

// The vote slider is shared by the five party shares: each gets a fifth of it, so the vote as a
// whole weighs as much as one question.
function featureWeights(weights: Record<string, number>): Map<string, number> {
  const features = new Map<string, number>();
  for (const question of ATTITUDES) features.set(question.code, weights[question.code]);
  for (const party of PARTIES) features.set(`vote_${party.code}`, weights[VOTE] / PARTIES.length);
  return features;
}

async function loadNames(con: AsyncDuckDBConnection): Promise<Map<number, string>> {
  const result = await con.query(namesQuery);
  return new Map(result.toArray().map((row) => [row.fed23, row.fed23_name]));
}

type Props = { con: AsyncDuckDBConnection; fed23: number };

export default function SimilarRidings({ con, fed23 }: Props) {
  const [ridings, setRidings] = useState<Map<number, RidingFeatures> | null>(null);
  const [names, setNames] = useState<Map<number, string>>(new Map());
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  useEffect(() => {
    loadFeatures(con).then(setRidings);
    loadNames(con).then(setNames);
  }, [con]);

  if (ridings === null || !ridings.has(fed23)) return null;
  const neighbours = nearestRidings(fed23, ridings, featureWeights(weights), NEIGHBOUR_COUNT);
  const sliders = [
    ...ATTITUDES.map((question) => ({ code: question.code, label: question.label })),
    { code: VOTE, label: "Official 2025 vote" },
  ];

  return (
    <section className="similar">
      <h2>Most similar ridings</h2>
      <p className="subtitle">
        Distance between the riding estimates, each question on the same scale. Weights from 0 (ignored) to 3.
      </p>
      <details>
        <summary>Weights</summary>
        {sliders.map((slider) => (
          <label key={slider.code} className="weight">
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={weights[slider.code]}
              onChange={(event) => setWeights({ ...weights, [slider.code]: Number(event.target.value) })}
            />
            <span className="number">{weights[slider.code]}</span>
            {slider.label}
          </label>
        ))}
      </details>
      <table>
        <thead>
          <tr>
            <th>Riding</th>
            <th className="number">Distance</th>
          </tr>
        </thead>
        <tbody>
          {neighbours.map((neighbour) => (
            <tr key={neighbour.fed23}>
              <td>
                <a href={`#/riding/${neighbour.fed23}`}>{names.get(neighbour.fed23)}</a>
              </td>
              <td className="number">{neighbour.distance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
