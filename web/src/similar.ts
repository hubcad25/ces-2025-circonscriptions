import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import similarQuery from "./similar.sql?raw";

// Standardized features of one riding, keyed by feature code (a question or vote_<party>).
export type RidingFeatures = Map<string, number>;

export type Neighbour = { fed23: number; distance: number };

export async function loadFeatures(
  con: AsyncDuckDBConnection,
): Promise<Map<number, RidingFeatures>> {
  const result = await con.query(similarQuery);
  const ridings = new Map<number, RidingFeatures>();
  for (const row of result.toArray()) {
    const { fed23, feature, z_score } = row.toJSON();
    if (!ridings.has(fed23)) ridings.set(fed23, new Map());
    ridings.get(fed23)!.set(feature, z_score);
  }
  return ridings;
}

// Weighted Euclidean distance, divided by the total weight so that distances stay comparable
// when weights change.
export function distance(a: RidingFeatures, b: RidingFeatures, weights: Map<string, number>): number {
  let sum = 0;
  let totalWeight = 0;
  for (const [feature, weight] of weights) {
    const gap = a.get(feature)! - b.get(feature)!;
    sum += weight * gap * gap;
    totalWeight += weight;
  }
  return totalWeight === 0 ? 0 : Math.sqrt(sum / totalWeight);
}

export function nearestRidings(
  fed23: number,
  ridings: Map<number, RidingFeatures>,
  weights: Map<string, number>,
  count: number,
): Neighbour[] {
  const target = ridings.get(fed23)!;
  const neighbours: Neighbour[] = [];
  for (const [other, features] of ridings) {
    if (other !== fed23) neighbours.push({ fed23: other, distance: distance(target, features, weights) });
  }
  return neighbours.sort((a, b) => a.distance - b.distance).slice(0, count);
}
