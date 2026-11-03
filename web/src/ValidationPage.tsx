import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { type CSSProperties, useEffect, useState } from "react";
import FilterControls, { type Filter, matches } from "./filters";
import { PARTIES } from "./parties";
import RidingTable, { type Riding } from "./RidingTable";
import ridingsQuery from "./ridings.sql?raw";

const WAVES = [
  { code: "vote_post", label: "Reported vote" },
  { code: "vote_pre", label: "Vote intention" },
];

async function loadRidings(
  con: AsyncDuckDBConnection,
  question: string,
  party: string,
): Promise<Riding[]> {
  const statement = await con.prepare(ridingsQuery);
  const result = await statement.query(question, party);
  await statement.close();
  return result.toArray().map((row) => row.toJSON() as Riding);
}

export default function ValidationPage({ con }: { con: AsyncDuckDBConnection }) {
  const [wave, setWave] = useState(WAVES[0].code);
  const [party, setParty] = useState(PARTIES[0]);
  const [filter, setFilter] = useState<Filter>({ province: "", search: "" });
  const [allRidings, setRidings] = useState<Riding[]>([]);

  useEffect(() => {
    loadRidings(con, wave, party.code).then(setRidings);
  }, [con, wave, party]);

  const ridings = allRidings.filter((riding) => matches(riding, filter));
  const covered = ridings.filter((riding) => riding.is_covered).length;
  const meanGap = ridings.reduce((sum, riding) => sum + Math.abs(riding.gap), 0) / ridings.length;

  return (
    <div style={{ "--party": party.color } as CSSProperties}>
      <h1>Model validation on the 2025 vote</h1>
      <p className="subtitle">
        MRP estimates from the Canadian Election Study, compared with the official results. Use it
        to see where the model is reliable before reading the estimates of a riding.
      </p>
      <div className="controls">
        {WAVES.map((option) => (
          <button
            key={option.code}
            className="wave"
            aria-pressed={option.code === wave}
            onClick={() => setWave(option.code)}
          >
            {option.label}
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
            {option.code}
          </button>
        ))}
        <FilterControls filter={filter} onChange={setFilter} />
      </div>
      {ridings.length === 0 ? (
        <p className="stats">No riding matches.</p>
      ) : (
        <>
          <p className="stats">
            <strong>{ridings.length}</strong> ridings · mean absolute gap{" "}
            <strong>{(100 * meanGap).toFixed(1)} pts</strong> ·{" "}
            <strong>{Math.round((100 * covered) / ridings.length)}%</strong> of results within
            the 90% interval
          </p>
          <RidingTable ridings={ridings} />
          <p className="note">
            Bar: 90% interval of the estimate, widened by a factor calibrated on the reported
            vote; dot: estimate; line: official result. Gap = estimate minus result: red when the
            model overestimates, blue when it underestimates.
          </p>
        </>
      )}
    </div>
  );
}
