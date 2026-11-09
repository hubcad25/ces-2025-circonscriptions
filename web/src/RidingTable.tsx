import { useState } from "react";
import { useLang } from "./i18n";
import IntervalBar, { IntervalAxis } from "./IntervalBar";
import { provinceLabel } from "./provinces";

export type Riding = {
  fed23: number;
  fed23_name: string;
  province: string;
  estimate_mean: number;
  estimate_low: number;
  estimate_high: number;
  actual_share: number;
  gap: number;
  is_covered: boolean;
};

type SortKey = "fed23_name" | "estimate_mean" | "actual_share" | "gap" | "is_covered";

// The class sets the header alignment so that it lines up with the values below.
const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "fed23_name", label: "Riding" },
  { key: "estimate_mean", label: "MRP %", className: "center" },
  { key: "actual_share", label: "Result %", className: "number" },
  { key: "gap", label: "Gap (pts)", className: "number" },
  { key: "is_covered", label: "Interval" },
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
  const { lang } = useLang();
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
                className={column.className}
                onClick={() => sortBy(column.key)}
              >
                {column.label}
                {column.key === sortKey ? (ascending ? " ↑" : " ↓") : ""}
              </th>
            ))}
            <th className="wide-only">
              90% interval and result (%)
              <IntervalAxis />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((riding) => (
            <tr key={riding.fed23}>
              <td>
                <a href={`#/riding/${riding.fed23}`}>{riding.fed23_name}</a>{" "}
                <span className="province">{provinceLabel(riding.province, lang)}</span>
              </td>
              <td>
                <div className="estimate">
                  <span className="bound">{percent(riding.estimate_low)}</span>
                  <span>{percent(riding.estimate_mean)}</span>
                  <span className="bound">{percent(riding.estimate_high)}</span>
                </div>
              </td>
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
              <td className="wide-only">
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
