import type { Estimate } from "./EstimateTable";
import type { Estimate as RidingEstimate } from "./RidingPage";
import type { Riding as ValidationRiding } from "./RidingTable";

// MapLibre fetches files from a web worker, where only absolute URLs resolve.
export const dataUrl = (name: string) =>
  new URL(`${import.meta.env.BASE_URL}data/${name}`, window.location.href).href;

// The files written by `make export` (pipeline/export.py).
export type RidingName = { fed23: number; fed23_name: string; province: string };
// National ("canada") and provincial estimates: summaries[question][category][area].
type Summaries = Record<string, Record<string, Record<string, number>>>;
// [fed23, mean, low, high] by category.
type QuestionFile = Record<string, [number, number, number, number][]>;
// [mean, low, high] by question and category, followed by the official result for the vote.
type RidingFile = {
  estimates: Record<string, Record<string, number[]>>;
  similar: Record<string, Neighbours>;
};
export type Neighbours = { similar: number[]; different: number[] };
// The model's national estimate next to the survey's raw and weighted means (survey_means.sql).
export type SurveyMean = {
  question: string;
  category: string;
  model_mean: number;
  raw_mean: number;
  weighted_mean: number;
  // The official 2025 national result, for the vote only.
  official_share: number | null;
};
// [fed23, mean, low, high, result] by question and party.
type ValidationFile = Record<string, Record<string, [number, number, number, number, number][]>>;

// Each file is downloaded once, then shared by every page that needs it.
const files = new Map<string, Promise<unknown>>();

function fetchJson<T>(name: string): Promise<T> {
  if (!files.has(name)) {
    files.set(
      name,
      fetch(dataUrl(name)).then((response) => {
        if (!response.ok) throw new Error(`Cannot load ${name}: ${response.status}`);
        return response.json();
      }),
    );
  }
  return files.get(name) as Promise<T>;
}

export async function loadRidingNames(): Promise<Map<number, RidingName>> {
  const names = await fetchJson<RidingName[]>("riding_names.json");
  return new Map(names.map((riding) => [riding.fed23, riding]));
}

// One row per riding for the map and table of the Explore page.
export async function loadQuestion(question: string, category: string): Promise<Estimate[]> {
  const [names, summaries, file] = await Promise.all([
    loadRidingNames(),
    fetchJson<Summaries>("summaries.json"),
    fetchJson<QuestionFile>(`questions/${question}.json`),
  ]);
  // The official results have no national or provincial estimate.
  const reference = summaries[question]?.[category];
  return (file[category] ?? []).map(([fed23, mean, low, high]) => {
    const riding = names.get(fed23)!;
    return {
      ...riding,
      estimate_mean: mean,
      estimate_low: low,
      estimate_high: high,
      national: reference?.canada,
      provincial: reference?.[riding.province],
    };
  });
}

export type RidingData = { estimates: RidingEstimate[]; similar: Record<string, Neighbours> };

// Every question for one riding, or null for an unknown riding code.
export async function loadRiding(fed23: number): Promise<RidingData | null> {
  const names = await loadRidingNames();
  const riding = names.get(fed23);
  if (riding === undefined) return null;
  const [summaries, file] = await Promise.all([
    fetchJson<Summaries>("summaries.json"),
    fetchJson<RidingFile>(`ridings/${fed23}.json`),
  ]);
  const estimates = Object.entries(file.estimates).flatMap(([question, categories]) =>
    Object.entries(categories).map(([category, [mean, low, high, actual]]) => ({
      question,
      category,
      fed23_name: riding.fed23_name,
      province: riding.province,
      estimate_mean: mean,
      estimate_low: low,
      estimate_high: high,
      actual_share: actual ?? null,
      national_share: summaries[question][category].canada ?? null,
      provincial_share: summaries[question][category][riding.province] ?? null,
    })),
  );
  return { estimates, similar: file.similar };
}

// One row per riding where the party ran, for the Validation page.
export async function loadValidation(question: string, party: string): Promise<ValidationRiding[]> {
  const [names, file] = await Promise.all([
    loadRidingNames(),
    fetchJson<ValidationFile>("validation.json"),
  ]);
  return (file[question]?.[party] ?? []).map(([fed23, mean, low, high, actual]) => ({
    ...names.get(fed23)!,
    estimate_mean: mean,
    estimate_low: low,
    estimate_high: high,
    actual_share: actual,
    gap: mean - actual,
    is_covered: low <= actual && actual <= high,
  }));
}

export const loadSurveyMeans = () => fetchJson<SurveyMean[]>("survey_means.json");
