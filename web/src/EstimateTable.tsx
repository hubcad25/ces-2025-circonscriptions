import { useState } from "react";
import { useLang } from "./i18n";
import IntervalBar, { IntervalAxis } from "./IntervalBar";
import { provinceLabel } from "./provinces";

export type Estimate = {
  fed23: number;
  fed23_name: string;
  province: string;
  estimate_mean: number;
  estimate_low: number;
  estimate_high: number;
  national?: number | null;
  provincial?: number | null;
};

type SortKey = "fed23_name" | "estimate_mean";

// topRank is set when the values are mean positions on a scale (1 to topRank), not shares.
type Props = { estimates: Estimate[]; isOfficial: boolean; topRank?: number };

// An official result is a count, not an estimate: it is shown without an interval.
export default function EstimateTable({ estimates, isOfficial, topRank }: Props) {
  const { lang, t } = useLang();
  const percent = (value: number) =>
    topRank === undefined ? (100 * value).toFixed(1) : value.toFixed(2);

  const [sortKey, setSortKey] = useState<SortKey>("estimate_mean");
  const [ascending, setAscending] = useState(false);

  const sorted = [...estimates].sort((a, b) => {
    const order =
      sortKey === "fed23_name"
        ? a.fed23_name.localeCompare(b.fed23_name)
        : a.estimate_mean - b.estimate_mean;
    return ascending ? order : -order;
  });

  function sortBy(key: SortKey) {
    setAscending(key === sortKey ? !ascending : key === "fed23_name");
    setSortKey(key);
  }

  const arrow = (key: SortKey) => (key === sortKey ? (ascending ? " ↑" : " ↓") : "");

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th onClick={() => sortBy("fed23_name")}>
              {t("Riding", "Circonscription")}
              {arrow("fed23_name")}
            </th>
            <th className="center" onClick={() => sortBy("estimate_mean")}>
              {isOfficial
                ? t("Result %", "Résultat %")
                : topRank !== undefined
                  ? t(`Mean (1 to ${topRank})`, `Moyenne (1 à ${topRank})`)
                  : "MRP %"}
              {arrow("estimate_mean")}
            </th>
            {!isOfficial && (
              <th className="wide-only">
                {t("90% interval", "Intervalle à 90 %")}
                {topRank === undefined && " (%)"}
                <IntervalAxis topRank={topRank} />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((estimate) => (
            <tr key={estimate.fed23}>
              <td>
                <a href={`#/riding/${estimate.fed23}`}>{estimate.fed23_name}</a>{" "}
                <span className="province">{provinceLabel(estimate.province, lang)}</span>
              </td>
              {isOfficial ? (
                <td className="center">{percent(estimate.estimate_mean)}</td>
              ) : (
                <>
                  <td>
                    <div className="estimate">
                      <span className="bound">{percent(estimate.estimate_low)}</span>
                      <span>{percent(estimate.estimate_mean)}</span>
                      <span className="bound">{percent(estimate.estimate_high)}</span>
                    </div>
                  </td>
                  <td className="wide-only">
                    <IntervalBar
                      low={estimate.estimate_low}
                      mean={estimate.estimate_mean}
                      high={estimate.estimate_high}
                      topRank={topRank}
                    />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
