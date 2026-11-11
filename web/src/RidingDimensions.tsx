import { type CSSProperties, useEffect, useState } from "react";
import { loadRidingDimensions, type RidingDimension } from "./data";
import { DIMENSIONS, LEFT, RIGHT } from "./dimensions";
import { useLang } from "./i18n";
import { IntervalKey, TERRITORIES } from "./RidingProfile";

const WIDTH = 400;
const HEIGHT = 24;
const MIDDLE = HEIGHT / 2;
// Room on each side so that the end markers are not cut.
const PADDING = 8;
// A riding whose interval contains Canada's score is not shown as leaning either way.
const NEUTRAL = "#98a2b3";

type BarProps = { row: RidingDimension; hasProvince: boolean };

// Canada is the vertical line in the middle; the axis reaches the riding furthest from it on
// either side. The riding is the dot with its interval, its province the ring.
function DimensionBar({ row, hasProvince }: BarProps) {
  const x = (score: number) =>
    WIDTH / 2 + ((score - row.national) / row.spread) * (WIDTH / 2 - PADDING);
  return (
    <svg className="scale-bar dimension-bar" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img">
      <line className="track" x1={PADDING} x2={WIDTH - PADDING} y1={MIDDLE} y2={MIDDLE} />
      <line className="canada" x1={WIDTH / 2} x2={WIDTH / 2} y1={2} y2={HEIGHT - 2} />
      <rect
        className="range"
        x={x(row.low)}
        y={MIDDLE - 4}
        width={x(row.high) - x(row.low)}
        height={8}
        rx={4}
      />
      <circle className="mean" cx={x(row.mean)} cy={MIDDLE} r={5} />
      {hasProvince && <circle className="reference" cx={x(row.provincial)} cy={MIDDLE} r={4} />}
    </svg>
  );
}

type Props = { fed23: number; province: string; ridingName: string; provinceName: string };

export default function RidingDimensions({ fed23, province, ridingName, provinceName }: Props) {
  const { lang, t } = useLang();
  const [rows, setRows] = useState<RidingDimension[]>([]);

  useEffect(() => {
    loadRidingDimensions(fed23, province).then(setRows);
  }, [fed23, province]);

  // A territory's score is its single riding's: its marker would only repeat the riding's.
  const hasProvince = !TERRITORIES.includes(province);

  return (
    <section id="dimensions" className="riding-dimensions">
      <h2>{t("Dimensions", "Dimensions")}</h2>
      <p className="profile-legend">
        <IntervalKey />
        <span className="key-name" title={ridingName}>
          {ridingName}
        </span>
        {hasProvince && (
          <>
            <span className="key-reference" /> {provinceName}
          </>
        )}
        <span className="key-canada" /> Canada
      </p>
      <ul>
        {rows.map((row) => {
          const dimension = DIMENSIONS.find((candidate) => candidate.code === row.dimension)!;
          const isNeutral = row.low <= row.national && row.national <= row.high;
          const color = isNeutral ? NEUTRAL : row.mean < row.national ? LEFT : RIGHT;
          return (
            <li key={row.dimension} style={{ "--party": color } as CSSProperties}>
              <span className="dimension-name">{dimension.label[lang]}</span>
              <span className="dimension-end left" style={{ color: LEFT }}>{dimension.ends[0][lang]}</span>
              <DimensionBar row={row} hasProvince={hasProvince} />
              <span className="dimension-end" style={{ color: RIGHT }}>{dimension.ends[1][lang]}</span>
            </li>
          );
        })}
      </ul>
      <p className="legend-caption">
        {t(
          "Canada is the line in the middle; each axis reaches the riding furthest from it. The bar is the riding's 90% interval, grey when it includes Canada.",
          "Le Canada est la ligne du milieu ; chaque axe va jusqu'à la circonscription la plus éloignée. La barre est l'intervalle à 90 % de la circonscription, grise quand elle contient le Canada.",
        )}
      </p>
    </section>
  );
}
