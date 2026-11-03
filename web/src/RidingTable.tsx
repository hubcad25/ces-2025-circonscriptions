import { useState } from "react";
import IntervalBar from "./IntervalBar";

export type Riding = {
  fed23: number;
  fed23_name: string;
  estimate_mean: number;
  estimate_low: number;
  estimate_high: number;
  actual_share: number;
  gap: number;
  is_covered: boolean;
};

type SortKey = "fed23_name" | "estimate_mean" | "actual_share" | "gap" | "is_covered";

const COLUMNS: { key: SortKey; label: string; isNumber: boolean }[] = [
  { key: "fed23_name", label: "Riding", isNumber: false },
  { key: "estimate_mean", label: "MRP %", isNumber: true },
  { key: "actual_share", label: "Result %", isNumber: true },
  { key: "gap", label: "Gap (pts)", isNumber: true },
  { key: "is_covered", label: "Interval", isNumber: false },
];

const percent = (share: number) => (100 * share).toFixed(1);
const signed = (share: number) => `${share > 0 ? "+" : ""}${(100 * share).toFixed(1)}`;

function compare(a: Riding, b: Riding, key: SortKey): number {
  if (key === "fed23_name") return a.fed23_name.localeCompare(b.fed23_name);
  return Number(a[key]) - Number(b[key]);
}

// Overestimates are tinted red and underestimates blue, darker as the gap nears the largest
// gap of the column.
function gapColor(gap: number, maxGap: number): string {
  const alpha = (0.6 * Math.abs(gap)) / maxGap;
  return gap > 0 ? `rgba(240, 68, 56, ${alpha})` : `rgba(46, 144, 250, ${alpha})`;
}

export default function RidingTable({ ridings }: { ridings: Riding[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("fed23_name");
  const [ascending, setAscending] = useState(true);

  const maxGap = Math.max(...ridings.map((riding) => Math.abs(riding.gap)));
  const sorted = [...ridings].sort((a, b) => (ascending ? 1 : -1) * compare(a, b, sortKey));

  function sortBy(key: SortKey) {
    setAscending(key === sortKey ? !ascending : true);
    setSortKey(key);
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                className={column.isNumber ? "number" : undefined}
                onClick={() => sortBy(column.key)}
              >
                {column.label}
                {column.key === sortKey ? (ascending ? " ↑" : " ↓") : ""}
              </th>
            ))}
            <th>90% interval and result</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((riding) => (
            <tr key={riding.fed23}>
              <td>{riding.fed23_name}</td>
              <td className="number">{percent(riding.estimate_mean)}</td>
              <td className="number">{percent(riding.actual_share)}</td>
              <td
                className="number gap"
                style={{ background: gapColor(riding.gap, maxGap) }}
              >
                {signed(riding.gap)}
              </td>
              <td className={riding.is_covered ? undefined : "miss"}>
                {riding.is_covered ? "inside" : "outside"}
              </td>
              <td>
                <IntervalBar
                  low={riding.estimate_low}
                  mean={riding.estimate_mean}
                  high={riding.estimate_high}
                  actual={riding.actual_share}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
