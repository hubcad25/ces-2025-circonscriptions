const WIDTH = 160;
const HEIGHT = 14;
const SHARE_TICKS = [0, 0.25, 0.5, 0.75, 1];

// Every row uses the same scale so that ridings can be compared at a glance: 0 to 100% for a
// share, or the answer ranks (1 to the number of answers) for a mean position on a scale.
function axis(topRank?: number) {
  if (topRank === undefined) {
    return {
      ticks: SHARE_TICKS,
      x: (value: number) => value * WIDTH,
      label: (tick: number) => 100 * tick,
    };
  }
  return {
    ticks: Array.from({ length: topRank }, (_, index) => index + 1),
    x: (value: number) => ((value - 1) / (topRank - 1)) * WIDTH,
    label: (tick: number) => tick,
  };
}

// Questions without an official result (attitudes) have no actual line; the national share,
// when given, is drawn as a small diamond.
type Props = {
  low: number;
  mean: number;
  high: number;
  actual?: number | null;
  national?: number;
  topRank?: number;
};

export default function IntervalBar({ low, mean, high, actual, national, topRank }: Props) {
  const { ticks, x } = axis(topRank);
  return (
    <svg className="interval" width={WIDTH} height={HEIGHT} role="img">
      {ticks.map((tick) => (
        <line key={tick} className="grid" x1={x(tick)} x2={x(tick)} y1={0} y2={HEIGHT} />
      ))}
      <rect className="range" x={x(low)} y={3} width={x(high) - x(low)} height={8} />
      <circle className="mean" cx={x(mean)} cy={7} r={3} />
      {national !== undefined && (
        <rect
          className="national"
          x={x(national) - 3}
          y={4}
          width={6}
          height={6}
          transform={`rotate(45 ${x(national)} 7)`}
        />
      )}
      {actual != null && (
        <line className="actual" x1={x(actual)} x2={x(actual)} y1={0} y2={HEIGHT} />
      )}
    </svg>
  );
}

// Placed in the column header, above the bars, with the same width and ticks.
export function IntervalAxis({ topRank }: { topRank?: number }) {
  const { ticks, x, label } = axis(topRank);
  return (
    <svg className="interval-axis" width={WIDTH} height={12} role="img">
      {ticks.map((tick, index) => (
        <text
          key={tick}
          x={x(tick)}
          y={10}
          textAnchor={index === 0 ? "start" : index === ticks.length - 1 ? "end" : "middle"}
        >
          {label(tick)}
        </text>
      ))}
    </svg>
  );
}
