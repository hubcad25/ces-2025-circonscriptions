import * as duckdb from "@duckdb/duckdb-wasm";
import ehWasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import ehWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import mvpWasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvpWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";

const TABLES = ["fed_summaries", "national_summaries", "province_summaries", "vote_gaps"];

// DuckDB picks the build that the browser supports (with or without WebAssembly exceptions).
const BUNDLES: duckdb.DuckDBBundles = {
  mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
  eh: { mainModule: ehWasm, mainWorker: ehWorker },
};

export async function openDatabase(): Promise<duckdb.AsyncDuckDBConnection> {
  const bundle = await duckdb.selectBundle(BUNDLES);
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), new Worker(bundle.mainWorker!));
  await db.instantiate(bundle.mainModule);
  for (const table of TABLES) {
    const url = new URL(`${import.meta.env.BASE_URL}data/${table}.parquet`, window.location.href);
    await db.registerFileURL(`${table}.parquet`, url.href, duckdb.DuckDBDataProtocol.HTTP, false);
  }
  return db.connect();
}
