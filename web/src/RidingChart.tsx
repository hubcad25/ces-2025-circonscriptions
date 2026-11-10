import { useLang } from "./i18n";

// One small chart per answer, set side by side. Each has three rows on the same 0 to 100% scale:
// the riding's estimate (interval, mean and official result), its province, then Canada. The row
// names are drawn once, to the left of the first chart.
// Room on each side for the interval's bound labels.
const PADDING = 30;
const HEIGHT = 100;
const RIDING_ROW = 30;
const PROVINCE_ROW = 60;
const CANADA_ROW = 86;
const TICKS = [0, 0.5, 1];
export const LABEL_WIDTH = 110;
// Longer riding names are cut to fit the label column; the full name shows on hover.
const MAX_LABEL_LENGTH = 14;

// The plot width follows the space left on the page, shared between the answers.
export const chartWidth = (plotWidth: number) => plotWidth + 2 * PADDING;
const scale = (plotWidth: number) => (share: number) => PADDING + share * plotWidth;
const percent = (share: number) => (100 * share).toFixed(1);

// Canada's maple leaf, about 20 units tall and centered on (0, 0).
const MAPLE_LEAF =
  "M0,-10 L1.8,-6.6 L3.6,-7.6 L2.8,-3 L6,-5.4 L5.4,-3.6 L9,-4.2 L7.8,-2 L9,-1.2 L4.6,2.6 " +
  "L5.4,4.2 L0.6,3.4 L0.6,8 L-0.6,8 L-0.6,3.4 L-5.4,4.2 L-4.6,2.6 L-9,-1.2 L-7.8,-2 " +
  "L-9,-4.2 L-5.4,-3.6 L-6,-5.4 L-2.8,-3 L-3.6,-7.6 L-1.8,-6.6 Z";

type Props = {
  plotWidth: number;
  low: number;
  mean: number;
  high: number;
  actual: number | null;
  national: number | null;
  provincial: number | null;
};

export default function RidingChart(props: Props) {
  const { plotWidth, low, mean, high, actual, national, provincial } = props;
  const x = scale(plotWidth);
  return (
    <svg className="riding-chart" width={chartWidth(plotWidth)} height={HEIGHT} role="img">
      {TICKS.map((tick) => (
        <line key={tick} className="grid" x1={x(tick)} x2={x(tick)} y1={8} y2={HEIGHT} />
      ))}
      {[RIDING_ROW, PROVINCE_ROW, CANADA_ROW].map((row) => (
        <line key={row} className="track" x1={x(0)} x2={x(1)} y1={row} y2={row} />
      ))}
      <text className="label-mean" x={x(mean)} y={RIDING_ROW - 10} textAnchor="middle">
        {percent(mean)}
      </text>
      <text className="label-bound" x={x(low) - 5} y={RIDING_ROW + 4} textAnchor="end">
        {percent(low)}
      </text>
      <text className="label-bound" x={x(high) + 5} y={RIDING_ROW + 4} textAnchor="start">
        {percent(high)}
      </text>
      <rect className="range" x={x(low)} y={RIDING_ROW - 5} width={x(high) - x(low)} height={10} />
      <circle className="mean" cx={x(mean)} cy={RIDING_ROW} r={4.5} />
      {actual !== null && (
        <line
          className="actual"
          x1={x(actual)}
          x2={x(actual)}
          y1={RIDING_ROW - 8}
          y2={RIDING_ROW + 8}
        />
      )}
      {provincial !== null && (
        <>
          <circle className="provincial" cx={x(provincial)} cy={PROVINCE_ROW} r={4.5} />
          <text className="label-reference" x={x(provincial) + 9} y={PROVINCE_ROW + 4}>
            {percent(provincial)}
          </text>
        </>
      )}
      {national !== null && (
        <>
          <path
            className="maple-leaf"
            d={MAPLE_LEAF}
            transform={`translate(${x(national)} ${CANADA_ROW}) scale(0.8)`}
          />
          <text className="label-reference" x={x(national) + 11} y={CANADA_ROW + 4}>
            {percent(national)}
          </text>
        </>
      )}
    </svg>
  );
}

// Placed above each chart, with the same width and ticks.
// Only the last tick carries the unit: enough to read the scale without crowding it.
export function RidingChartAxis({ plotWidth }: { plotWidth: number }) {
  const { t } = useLang();
  const x = scale(plotWidth);
  return (
    <svg className="riding-chart-axis" width={chartWidth(plotWidth)} height={16} role="img">
      {TICKS.map((tick) => (
        <text key={tick} x={x(tick)} y={13} textAnchor="middle">
          {tick === 1 ? t("100%", "100 %") : 100 * tick}
        </text>
      ))}
    </svg>
  );
}

type LabelProps = { ridingName: string; provinceName: string };

// The row names, aligned with the rows of the charts to their right.
export function RidingChartLabels({ ridingName, provinceName }: LabelProps) {
  const rows = [
    { y: RIDING_ROW, label: ridingName },
    { y: PROVINCE_ROW, label: provinceName },
    { y: CANADA_ROW, label: "Canada" },
  ];
  return (
    <svg className="riding-chart" width={LABEL_WIDTH} height={HEIGHT} role="img">
      {rows.map(({ y, label }) => (
        <text
          key={label}
          className="row-label"
          x={LABEL_WIDTH - 8}
          y={y + 4}
          textAnchor="end"
        >
          <title>{label}</title>
          {label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…` : label}
        </text>
      ))}
    </svg>
  );
}
