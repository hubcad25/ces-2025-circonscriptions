import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { openDatabase } from "./duckdb";
import { PARTIES } from "./parties";
import RidingPage from "./RidingPage";
import RidingMap from "./RidingMap";
import RidingTable, { type Riding } from "./RidingTable";
import ridingsQuery from "./ridings.sql?raw";

// West to east, then the territories, as in most Canadian tables.
const PROVINCES = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"];

// Lets "montreal" match "Montréal" and "quebec" match "Québec".
const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

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

export default function App() {
  const [con, setCon] = useState<AsyncDuckDBConnection | null>(null);
  const [wave, setWave] = useState(WAVES[0].code);
  const [party, setParty] = useState(PARTIES[0]);
  const [province, setProvince] = useState("");
  const [search, setSearch] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const [hash, setHash] = useState(window.location.hash);
  const [allRidings, setRidings] = useState<Riding[]>([]);

  useEffect(() => {
    openDatabase().then(setCon);
  }, []);

  // Pages are addressed by the URL hash (#/riding/24059), which GitHub Pages serves as is.
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // "/" jumps to the search box, as on GitHub; it is ignored while typing in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isTyping = event.target instanceof HTMLInputElement;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (con) loadRidings(con, wave, party.code).then(setRidings);
  }, [con, wave, party]);

  const ridingMatch = hash.match(/^#\/riding\/(\d+)$/);
  if (con && ridingMatch) {
    return (
      <main>
        <RidingPage con={con} fed23={Number(ridingMatch[1])} />
      </main>
    );
  }

  const view = hash === "#/map" ? "map" : "validation";
  const ridings = allRidings.filter(
    (riding) =>
      (province === "" || riding.province === province) &&
      normalize(riding.fed23_name).includes(normalize(search)),
  );
  const covered = ridings.filter((riding) => riding.is_covered).length;
  const meanGap = ridings.reduce((sum, riding) => sum + Math.abs(riding.gap), 0) / ridings.length;

  return (
    <main style={{ "--party": party.color } as CSSProperties}>
      <nav className="tabs">
        <a href="#/" aria-current={view === "validation" ? "page" : undefined}>
          Validation
        </a>
        <a href="#/map" aria-current={view === "map" ? "page" : undefined}>
          Map
        </a>
      </nav>
      <h1>{view === "map" ? "2025 federal vote by riding" : "Model validation on the 2025 vote"}</h1>
      <p className="subtitle">
        {view === "map"
          ? "MRP estimates from the Canadian Election Study."
          : "MRP estimates from the Canadian Election Study, compared with the official results."}
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
        <select value={province} onChange={(event) => setProvince(event.target.value)}>
          <option value="">All provinces</option>
          {PROVINCES.map((code) => (
            <option key={code}>{code}</option>
          ))}
        </select>
        <input
          ref={searchInput}
          type="search"
          placeholder="Search riding (press /)"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setSearch("");
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      {con === null ? (
        <p className="subtitle">Loading data...</p>
      ) : ridings.length === 0 ? (
        <p className="stats">No riding matches.</p>
      ) : view === "map" ? (
        <RidingMap ridings={ridings} color={party.color} />
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
            Bar: 90% interval of the estimate, widened by a factor calibrated on the reported vote; dot:
            estimate; line: official result. Gap = estimate minus result: red when the model
            overestimates, blue when it underestimates.
          </p>
        </>
      )}
    </main>
  );
}
