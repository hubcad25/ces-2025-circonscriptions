const WIDTH = 160;
const HEIGHT = 14;

// Every row uses the same 0 to 100% scale so that ridings can be compared at a glance.
const x = (share: number) => share * WIDTH;

type Props = { low: number; mean: number; high: number; actual: number };

export default function IntervalBar({ low, mean, high, actual }: Props) {
  return (
    <svg className="interval" width={WIDTH} height={HEIGHT} role="img">
      <rect className="range" x={x(low)} y={3} width={x(high) - x(low)} height={8} />
      <circle className="mean" cx={x(mean)} cy={7} r={3} />
      <line className="actual" x1={x(actual)} x2={x(actual)} y1={0} y2={HEIGHT} />
    </svg>
  );
}
