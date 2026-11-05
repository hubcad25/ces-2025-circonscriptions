import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { useEffect, useState } from "react";
import AboutPage from "./AboutPage";
import { openDatabase } from "./duckdb";
import ExplorePage from "./ExplorePage";
import RidingPage from "./RidingPage";
import ValidationPage from "./ValidationPage";

const TABS = [
  { hash: "#/", label: "Explore" },
  { hash: "#/validation", label: "Validation" },
  { hash: "#/about", label: "About" },
];

function Page({ con, hash }: { con: AsyncDuckDBConnection; hash: string }) {
  const ridingMatch = hash.match(/^#\/riding\/(\d+)$/);
  if (ridingMatch) return <RidingPage con={con} fed23={Number(ridingMatch[1])} />;
  if (hash === "#/validation") return <ValidationPage con={con} />;
  if (hash === "#/about") return <AboutPage />;
  return <ExplorePage con={con} />;
}

export default function App() {
  const [con, setCon] = useState<AsyncDuckDBConnection | null>(null);
  const [hash, setHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    openDatabase().then(setCon);
  }, []);

  // Pages are addressed by the URL hash (#/riding/24059), which GitHub Pages serves as is.
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-title">What Your Riding Thinks</div>
        {TABS.map((tab) => (
          <a key={tab.hash} href={tab.hash} aria-current={tab.hash === hash ? "page" : undefined}>
            {tab.label}
          </a>
        ))}
      </nav>
      <main>
        {con === null ? <p className="subtitle">Loading data...</p> : <Page con={con} hash={hash} />}
      </main>
    </div>
  );
}
