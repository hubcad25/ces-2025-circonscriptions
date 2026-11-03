const WIDTH = 160;
const HEIGHT = 14;
const TICKS = [0, 0.25, 0.5, 0.75, 1];

// Every row uses the same 0 to 100% scale so that ridings can be compared at a glance.
const x = (share: number) => share * WIDTH;

// Questions without an official result (vote intention, attitudes) have no actual line.
type Props = { low: number; mean: number; high: number; actual?: number | null };

export default function IntervalBar({ low, mean, high, actual }: Props) {
  return (
    <svg className="interval" width={WIDTH} height={HEIGHT} role="img">
      {TICKS.map((tick) => (
        <line key={tick} className="grid" x1={x(tick)} x2={x(tick)} y1={0} y2={HEIGHT} />
      ))}
      <rect className="range" x={x(low)} y={3} width={x(high) - x(low)} height={8} />
      <circle className="mean" cx={x(mean)} cy={7} r={3} />
      {actual != null && (
        <line className="actual" x1={x(actual)} x2={x(actual)} y1={0} y2={HEIGHT} />
      )}
    </svg>
  );
}

// Placed in the column header, above the bars, with the same width and ticks.
export function IntervalAxis() {
  return (
    <svg className="interval-axis" width={WIDTH} height={12} role="img">
      {TICKS.map((tick) => (
        <text
          key={tick}
          x={x(tick)}
          y={10}
          textAnchor={tick === 0 ? "start" : tick === 1 ? "end" : "middle"}
        >
          {100 * tick}
        </text>
      ))}
    </svg>
  );
}
