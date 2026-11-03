import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { type CSSProperties, useEffect, useState } from "react";
import { openDatabase } from "./duckdb";
import RidingTable, { type Riding } from "./RidingTable";
import ridingsQuery from "./ridings.sql?raw";

const PARTIES: { code: string; color: string }[] = [
  { code: "LPC", color: "#d71920" },
  { code: "CPC", color: "#1a4782" },
  { code: "NDP", color: "#e8590c" },
  { code: "BQ", color: "#0f8bab" },
  { code: "OTH", color: "#6b7178" },
];

async function loadRidings(con: AsyncDuckDBConnection, party: string): Promise<Riding[]> {
  const statement = await con.prepare(ridingsQuery);
  const result = await statement.query(party);
  await statement.close();
  return result.toArray().map((row) => row.toJSON() as Riding);
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function App() {
  const [con, setCon] = useState<AsyncDuckDBConnection | null>(null);
  const [party, setParty] = useState(PARTIES[0]);
  const [ridings, setRidings] = useState<Riding[]>([]);

  useEffect(() => {
    openDatabase().then(setCon);
  }, []);

  useEffect(() => {
    if (con) loadRidings(con, party.code).then(setRidings);
  }, [con, party]);

  const covered = ridings.filter((riding) => riding.is_covered).length;
  const meanGap = ridings.reduce((sum, riding) => sum + Math.abs(riding.gap), 0) / ridings.length;

  return (
    <main style={{ "--party": party.color } as CSSProperties}>
      <h1>2025 federal vote by riding</h1>
      <p className="subtitle">
        MRP estimates from the Canadian Election Study, compared with the official results.
      </p>
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
      </div>
      {con === null ? (
        <p className="subtitle">Loading data...</p>
      ) : (
        <>
          <div className="stats">
            <Stat value={String(ridings.length)} label="ridings" />
            <Stat value={`${(100 * meanGap).toFixed(1)} pts`} label="mean absolute gap" />
            <Stat
              value={`${Math.round((100 * covered) / ridings.length)}%`}
              label="results within the 90% interval"
            />
          </div>
          <RidingTable ridings={ridings} />
          <p className="note">
            Bar: 90% interval of the estimate, widened by a factor calibrated on this vote; dot:
            estimate; line: official result. Gap = estimate minus result: red when the model
            overestimates, blue when it underestimates.
          </p>
        </>
      )}
    </main>
  );
}
