import { useEffect, useState } from "react";
import { openDatabase } from "./duckdb";

export default function App() {
  const [ridings, setRidings] = useState<number | null>(null);

  useEffect(() => {
    openDatabase()
      .then((con) => con.query("SELECT count(DISTINCT fed23) AS n FROM 'fed_summaries.parquet'"))
      .then((result) => setRidings(Number(result.get(0)!.n)));
  }, []);

  return (
    <main>
      <h1>CES 2025 by riding</h1>
      <p>{ridings === null ? "Loading..." : `${ridings} ridings loaded.`}</p>
    </main>
  );
}
