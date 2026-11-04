// A larger chart for the riding page, in three labelled rows on the same 0 to 100% scale: the
// riding's estimate (interval, mean and official result), its province, then Canada.
const LABEL_WIDTH = 64;
const PLOT_WIDTH = 520;
// Room on each side for the interval's bound labels.
const PADDING = 44;
const WIDTH = LABEL_WIDTH + PLOT_WIDTH + 2 * PADDING;
const HEIGHT = 128;
const RIDING_ROW = 36;
const PROVINCE_ROW = 76;
const CANADA_ROW = 108;
const TICKS = [0, 0.25, 0.5, 0.75, 1];

const x = (share: number) => LABEL_WIDTH + PADDING + share * PLOT_WIDTH;
const percent = (share: number) => (100 * share).toFixed(1);

// Canada's maple leaf, about 20 units tall and centered on (0, 0).
const MAPLE_LEAF =
  "M0,-10 L1.8,-6.6 L3.6,-7.6 L2.8,-3 L6,-5.4 L5.4,-3.6 L9,-4.2 L7.8,-2 L9,-1.2 L4.6,2.6 " +
  "L5.4,4.2 L0.6,3.4 L0.6,8 L-0.6,8 L-0.6,3.4 L-5.4,4.2 L-4.6,2.6 L-9,-1.2 L-7.8,-2 " +
  "L-9,-4.2 L-5.4,-3.6 L-6,-5.4 L-2.8,-3 L-3.6,-7.6 L-1.8,-6.6 Z";

type Props = {
  low: number;
  mean: number;
  high: number;
  actual: number | null;
  national: number;
  provincial: number | null;
  province: string;
};

// A row name on the left, and a faint line across the plot to guide the eye.
function Row({ y, label }: { y: number; label: string }) {
  return (
    <>
      <text className="row-label" x={0} y={y + 5}>
        {label}
      </text>
      <line className="track" x1={x(0)} x2={x(1)} y1={y} y2={y} />
    </>
  );
}

export default function RidingChart(props: Props) {
  const { low, mean, high, actual, national, provincial, province } = props;
  return (
    <svg className="riding-chart" width={WIDTH} height={HEIGHT} role="img">
      {TICKS.map((tick) => (
        <line key={tick} className="grid" x1={x(tick)} x2={x(tick)} y1={14} y2={HEIGHT} />
      ))}
      <Row y={RIDING_ROW} label="Riding" />
      <Row y={PROVINCE_ROW} label={province} />
      <Row y={CANADA_ROW} label="Canada" />
      <text className="label-mean" x={x(mean)} y={RIDING_ROW - 14} textAnchor="middle">
        {percent(mean)}
      </text>
      <text className="label-bound" x={x(low) - 6} y={RIDING_ROW + 5} textAnchor="end">
        {percent(low)}
      </text>
      <text className="label-bound" x={x(high) + 6} y={RIDING_ROW + 5} textAnchor="start">
        {percent(high)}
      </text>
      <rect className="range" x={x(low)} y={RIDING_ROW - 8} width={x(high) - x(low)} height={16} />
      <circle className="mean" cx={x(mean)} cy={RIDING_ROW} r={7} />
      {actual !== null && (
        <line
          className="actual"
          x1={x(actual)}
          x2={x(actual)}
          y1={RIDING_ROW - 12}
          y2={RIDING_ROW + 12}
        />
      )}
      {provincial !== null && (
        <>
          <circle className="provincial" cx={x(provincial)} cy={PROVINCE_ROW} r={7} />
          <text className="label-reference" x={x(provincial) + 14} y={PROVINCE_ROW + 5}>
            {percent(provincial)}
          </text>
        </>
      )}
      <path
        className="maple-leaf"
        d={MAPLE_LEAF}
        transform={`translate(${x(national)} ${CANADA_ROW}) scale(1.2)`}
      />
      <text className="label-reference" x={x(national) + 16} y={CANADA_ROW + 5}>
        {percent(national)}
      </text>
    </svg>
  );
}

// Placed in the column header, above the charts, with the same width and ticks.
export function RidingChartAxis() {
  return (
    <svg className="riding-chart-axis" width={WIDTH} height={16} role="img">
      {TICKS.map((tick) => (
        <text key={tick} x={x(tick)} y={13} textAnchor="middle">
          {100 * tick}
        </text>
      ))}
    </svg>
  );
}
