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

// West to east, then the territories, as in most Canadian tables.
const PROVINCES = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"];

async function loadRidings(con: AsyncDuckDBConnection, party: string): Promise<Riding[]> {
  const statement = await con.prepare(ridingsQuery);
  const result = await statement.query(party);
  await statement.close();
  return result.toArray().map((row) => row.toJSON() as Riding);
}

export default function App() {
  const [con, setCon] = useState<AsyncDuckDBConnection | null>(null);
  const [party, setParty] = useState(PARTIES[0]);
  const [province, setProvince] = useState("");
  const [allRidings, setRidings] = useState<Riding[]>([]);

  useEffect(() => {
    openDatabase().then(setCon);
  }, []);

  useEffect(() => {
    if (con) loadRidings(con, party.code).then(setRidings);
  }, [con, party]);

  const ridings = province
    ? allRidings.filter((riding) => riding.province === province)
    : allRidings;
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
        <select value={province} onChange={(event) => setProvince(event.target.value)}>
          <option value="">All provinces</option>
          {PROVINCES.map((code) => (
            <option key={code}>{code}</option>
          ))}
        </select>
      </div>
      {con === null ? (
        <p className="subtitle">Loading data...</p>
      ) : ridings.length === 0 ? (
        <p className="stats">No candidate from this party in this province.</p>
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
            Bar: 90% interval of the estimate, widened by a factor calibrated on this vote; dot:
            estimate; line: official result. Gap = estimate minus result: red when the model
            overestimates, blue when it underestimates.
          </p>
        </>
      )}
    </main>
  );
}
