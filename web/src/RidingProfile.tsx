import type { CSSProperties } from "react";
import { useLang } from "./i18n";
import { provinceName } from "./provinces";
import { HIGH, LOW, type Question, QUESTIONS } from "./questions";
import type { Estimate } from "./RidingPage";

const ATTITUDES = QUESTIONS.filter((question) => question.isOrdinal);
const STANDOUT_COUNT = 4;

type Reference = "provincial_share" | "national_share";

type Standout = { question: Question; row: Estimate; reference: number; shift: number };

// The attitudes where the riding's mean answer is furthest from the reference mean. The shift is
// a share of the scale length so that 3-point and 5-point scales compare. Only differences the
// model is sure of count: the reference mean must lie outside the riding's interval.
function standouts(
  estimates: Estimate[],
  key: Reference,
  isSkipped: (row: Estimate) => boolean = () => false,
): Standout[] {
  return ATTITUDES.flatMap((question) => {
    const row = estimates.find((r) => r.question === question.code && r.category === "mean");
    const reference = row?.[key];
    if (!row || reference == null || isSkipped(row)) return [];
    if (row.estimate_low <= reference && reference <= row.estimate_high) return [];
    const shift = (row.estimate_mean - reference) / (question.categories.length - 1);
    return [{ question, row, reference, shift }];
  })
    .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift))
    .slice(0, STANDOUT_COUNT);
}

// The gap with Canada splits into the riding's gap with its province and the province's gap with
// Canada. When the province's part is the larger one, the riding mostly differs from Canada
// because its whole province does, and the comparison with Canada leaves it out.
function isMostlyProvincial(row: Estimate): boolean {
  const { provincial_share: province, national_share: canada } = row;
  if (province == null || canada == null) return false;
  return Math.abs(province - canada) > Math.abs(row.estimate_mean - province);
}

const BAR_WIDTH = 240;
const BAR_HEIGHT = 24;
const MIDDLE = BAR_HEIGHT / 2;
// Room on each side so that the end dots are not cut.
const BAR_PADDING = 8;

type BarProps = { low: number; mean: number; high: number; reference: number; ranks: number };

// The answer scale from 1 to ranks: the riding's mean and interval, and the reference mean as a
// hollow ring.
function ScaleBar({ low, mean, high, reference, ranks }: BarProps) {
  const x = (value: number) =>
    BAR_PADDING + ((value - 1) / (ranks - 1)) * (BAR_WIDTH - 2 * BAR_PADDING);
  return (
    <svg className="scale-bar" viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT}`} role="img">
      <line className="track" x1={x(1)} x2={x(ranks)} y1={MIDDLE} y2={MIDDLE} />
      {Array.from({ length: ranks }, (_, index) => (
        <line
          key={index}
          className="tick"
          x1={x(index + 1)}
          x2={x(index + 1)}
          y1={MIDDLE - 4}
          y2={MIDDLE + 4}
        />
      ))}
      <rect className="range" x={x(low)} y={MIDDLE - 4} width={x(high) - x(low)} height={8} rx={4} />
      <circle className="reference" cx={x(reference)} cy={MIDDLE} r={3.5} />
      <circle className="mean" cx={x(mean)} cy={MIDDLE} r={4.5} />
    </svg>
  );
}

// The headline's {more} becomes the direction word, capitalized when it opens the sentence.
function Headline({ text, isHigher }: { text: string; isHigher: boolean }) {
  const { t } = useLang();
  const [before, after] = text.split("{more}");
  const word = isHigher ? t("more", "plus") : t("less", "moins");
  return (
    <span className="standout-headline">
      {before}
      <strong>{before ? word : word[0].toUpperCase() + word.slice(1)}</strong>
      {after}
    </span>
  );
}

type GroupProps = {
  title: string;
  items: Standout[];
  onSelect: (question: Question) => void;
};

function StandoutGroup({ title, items, onSelect }: GroupProps) {
  const { lang, t } = useLang();
  return (
    <div>
      <h3>
        <span className="muted">{t("Compared with", "Référence :")}</span> {title}
      </h3>
      {items.length === 0 ? (
        <p className="subtitle">{t("No clear difference.", "Aucun écart net.")}</p>
      ) : (
        <ul>
          {items.map(({ question, row, reference, shift }) => {
            const ranks = question.categories.length;
            const color = shift > 0 ? HIGH : LOW;
            return (
              <li key={question.code}>
                <button
                  className="standout"
                  style={{ "--party": color } as CSSProperties}
                  onClick={() => onSelect(question)}
                >
                  {question.headline && <Headline text={question.headline[lang]} isHigher={shift > 0} />}
                  <span className="standout-question">{question.label[lang]}</span>
                  <ScaleBar
                    low={row.estimate_low}
                    mean={row.estimate_mean}
                    high={row.estimate_high}
                    reference={reference}
                    ranks={ranks}
                  />
                  <span className="standout-ends">
                    <span>{question.categories[0].label[lang]}</span>
                    <span>{question.categories[ranks - 1].label[lang]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// A territory's estimate is its single riding's, so comparing the two says nothing.
const TERRITORIES = ["YT", "NT", "NU"];

type Props = { estimates: Estimate[]; onSelect: (question: Question) => void };

export default function RidingProfile({ estimates, onSelect }: Props) {
  const { lang, t } = useLang();
  const code = estimates[0].province;
  const province = provinceName(code, lang);
  const isTerritory = TERRITORIES.includes(code);
  const provincial = isTerritory ? [] : standouts(estimates, "provincial_share");
  // No question appears in both lists, and the comparison with Canada keeps what is specific to
  // the riding beyond its province.
  const shown = new Set(provincial.map((item) => item.question.code));
  const national = standouts(
    estimates,
    "national_share",
    (row) => shown.has(row.question) || (!isTerritory && isMostlyProvincial(row)),
  );

  return (
    <section id="standouts" className="profile">
      <h2>{t("What stands out", "Ce qui se démarque")}</h2>
      <p className="profile-legend">
        <span className="key-mean" />
        <span className="key-name" title={estimates[0].fed23_name}>
          {estimates[0].fed23_name}
        </span>
        <span className="key-reference" /> {t("Reference", "Référence")}
      </p>
      <div className="profile-columns">
        {!isTerritory && <StandoutGroup title={province} items={provincial} onSelect={onSelect} />}
        <StandoutGroup title="Canada" items={national} onSelect={onSelect} />
      </div>
    </section>
  );
}
