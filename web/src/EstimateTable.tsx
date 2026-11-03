import { useState } from "react";
import IntervalBar, { IntervalAxis } from "./IntervalBar";

export type Estimate = {
  fed23: number;
  fed23_name: string;
  province: string;
  estimate_mean: number;
  estimate_low: number;
  estimate_high: number;
};

type SortKey = "fed23_name" | "estimate_mean";

const percent = (share: number) => (100 * share).toFixed(1);

export default function EstimateTable({ estimates }: { estimates: Estimate[] }) {
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
            <th onClick={() => sortBy("fed23_name")}>Riding{arrow("fed23_name")}</th>
            <th className="center" onClick={() => sortBy("estimate_mean")}>
              MRP %{arrow("estimate_mean")}
            </th>
            <th>
              90% interval (%)
              <IntervalAxis />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((estimate) => (
            <tr key={estimate.fed23}>
              <td>
                <a href={`#/riding/${estimate.fed23}`}>{estimate.fed23_name}</a>{" "}
                <span className="province">{estimate.province}</span>
              </td>
              <td>
                <div className="estimate">
                  <span className="bound">{percent(estimate.estimate_low)}</span>
                  <span>{percent(estimate.estimate_mean)}</span>
                  <span className="bound">{percent(estimate.estimate_high)}</span>
                </div>
              </td>
              <td>
                <IntervalBar
                  low={estimate.estimate_low}
                  mean={estimate.estimate_mean}
                  high={estimate.estimate_high}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
