import { type CSSProperties, useEffect, useRef, useState } from "react";
import { loadRiding, type RidingData } from "./data";
import RidingChart, {
  chartWidth,
  LABEL_WIDTH,
  RidingChartAxis,
  RidingChartLabels,
} from "./RidingChart";
import RidingMinimap from "./RidingMinimap";
import RidingProfile from "./RidingProfile";
import { useLang } from "./i18n";
import { provinceName } from "./provinces";
import { type Category, DEFAULT_QUESTION, type Question, QUESTIONS } from "./questions";
import QuestionSelect from "./QuestionSelect";
import RidingSearch from "./RidingSearch";
import SimilarRidings from "./SimilarRidings";

export type Estimate = {
  question: string;
  category: string;
  fed23_name: string;
  province: string;
  estimate_mean: number;
  estimate_low: number;
  estimate_high: number;
  actual_share: number | null;
  national_share: number | null;
  provincial_share: number | null;
};

const percent = (share: number) => (100 * share).toFixed(1);

type ChartProps = { question: Question; categories: Category[]; estimates: Estimate[] };

// Must match the gap of .facets in the styles.
const FACET_GAP = 12;
const MIN_PLOT_WIDTH = 110;

// One chart per answer, in scale order from left to right, sharing the width of the page.
function QuestionCharts({ question, categories, estimates }: ChartProps) {
  const { lang, t } = useLang();
  const container = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(container.current!);
    return () => observer.disconnect();
  }, []);

  const shown = categories.filter((category) =>
    estimates.some((row) => row.category === category.code),
  );
  if (shown.length === 0 && question.province) {
    const province = provinceName(question.province, lang);
    // Also a div, so that React keeps the element the resize observer watches.
    return (
      <div ref={container}>
        <p className="note">
          {t(
            `Asked only in ${province}: no estimate for this riding.`,
            `Question posée dans une seule province (${province}) : aucune estimation pour cette circonscription.`,
          )}
        </p>
      </div>
    );
  }
  const perChart = (available - LABEL_WIDTH) / shown.length - FACET_GAP;
  // On a narrow screen the charts no longer fit side by side: they stack, each with its own
  // row names and the full width.
  const isStacked = perChart - chartWidth(0) < MIN_PLOT_WIDTH;
  const plotWidth = isStacked
    ? Math.max(MIN_PLOT_WIDTH, available - LABEL_WIDTH - chartWidth(0))
    : perChart - chartWidth(0);

  const labels = shown.length > 0 && (
    <RidingChartLabels
      ridingName={estimates[0].fed23_name}
      provinceName={provinceName(estimates[0].province, lang)}
    />
  );

  return (
    <div className={isStacked ? "facets stacked" : "facets"} ref={container}>
      {!isStacked && labels && (
        <div className="facet">
          <div className="facet-title" />
          {labels}
        </div>
      )}
      {shown.map((category) => {
        const estimate = estimates.find((row) => row.category === category.code)!;
        const chart = (
          <div>
            <RidingChartAxis plotWidth={plotWidth} />
            <RidingChart
              plotWidth={plotWidth}
              low={estimate.estimate_low}
              mean={estimate.estimate_mean}
              high={estimate.estimate_high}
              actual={estimate.actual_share}
              national={estimate.national_share}
              provincial={estimate.provincial_share}
            />
          </div>
        );
        return (
          <div
            key={category.code}
            className="facet"
            style={{ "--party": category.color } as CSSProperties}
          >
            <div className="facet-title">{category.label[lang]}</div>
            {isStacked ? (
              <div className="facet-row">
                <div className="facet-labels">{labels}</div>
                {chart}
              </div>
            ) : (
              chart
            )}
          </div>
        );
      })}
    </div>
  );
}

// The vote is the only answer with a known truth: a footnote that checks the model in this riding.
function ModelCheck({ estimates }: { estimates: Estimate[] }) {
  const { t } = useLang();
  const votes = estimates.filter((row) => row.question === "vote_post" && row.actual_share !== null);
  if (votes.length === 0) return null;
  const inside = votes.filter(
    (row) => row.estimate_low <= row.actual_share! && row.actual_share! <= row.estimate_high,
  );
  const gap = (row: Estimate) => row.estimate_mean - row.actual_share!;
  const worst = votes.reduce((a, b) => (Math.abs(gap(b)) > Math.abs(gap(a)) ? b : a));
  const signed = `${gap(worst) > 0 ? "+" : ""}${percent(gap(worst))}`;
  return (
    <p className="note">
      {t(
        `Model check: the official 2025 vote falls inside the 90% interval for ${inside.length} of ${votes.length} parties (largest gap: ${worst.category}, ${signed} pts).`,
        `Validation : le vote officiel de 2025 tombe dans l'intervalle à 90 % pour ${inside.length} partis sur ${votes.length} (plus grand écart : ${worst.category}, ${signed} pts).`,
      )}
    </p>
  );
}

// Buttons rather than links: the hash already holds the page route.
const SECTIONS: { id: string; label: [string, string] }[] = [
  { id: "standouts", label: ["What stands out", "Ce qui se démarque"] },
  { id: "answers", label: ["Answers by question", "Réponses par question"] },
  { id: "similar", label: ["Similar and different ridings", "Circonscriptions semblables et différentes"] },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function RidingPage({ fed23 }: { fed23: number }) {
  const { lang, t } = useLang();
  // Undefined while loading, null for an unknown riding code.
  const [riding, setRiding] = useState<RidingData | null | undefined>(undefined);
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  // Grouped answers are easier to read; questions without groups ignore this choice.
  const [isGrouped, setGrouped] = useState(true);

  useEffect(() => {
    loadRiding(fed23).then(setRiding);
  }, [fed23]);

  // A card of the profile opens its question in the answers section.
  function showQuestion(next: Question) {
    setQuestion(next);
    scrollToSection("answers");
  }

  if (riding === undefined) return <p className="subtitle">{t("Loading riding...", "Chargement...")}</p>;
  if (riding === null) {
    return <p className="subtitle">{t(`Unknown riding ${fed23}.`, `Circonscription ${fed23} inconnue.`)}</p>;
  }
  const { estimates } = riding;

  return (
    <div className="riding-page">
      <div className="riding-nav">
        <a className="back" href="#/">
          {t("← All ridings", "← Toutes les circonscriptions")}
        </a>
        <RidingSearch />
      </div>
      <header className="riding-header">
        <RidingMinimap fed23={fed23} />
        <div>
          <h1>{estimates[0].fed23_name}</h1>
          <p className="subtitle">{provinceName(estimates[0].province, lang)}</p>
        </div>
      </header>
      <nav className="section-nav">
        {SECTIONS.map((section) => (
          <button key={section.id} onClick={() => scrollToSection(section.id)}>
            {t(...section.label)}
          </button>
        ))}
      </nav>
      <RidingProfile estimates={estimates} onSelect={showQuestion} />
      <h2 id="answers">{t("Answers by question", "Réponses par question")}</h2>
      <div className="controls">
        <QuestionSelect value={question} onChange={setQuestion} />
        {question.groups && (
          <>
            <span className="spacer" />
            {[true, false].map((option) => (
              <button
                key={String(option)}
                className="wave"
                aria-pressed={option === isGrouped}
                onClick={() => setGrouped(option)}
              >
                {option ? t("Grouped", "Regroupé") : t("Detailed", "Détaillé")}
              </button>
            ))}
          </>
        )}
      </div>
      <QuestionCharts
        question={question}
        categories={isGrouped && question.groups ? question.groups : question.categories}
        estimates={estimates.filter((estimate) => estimate.question === question.code)}
      />
      <p className="legend-caption">
        {t(
          "One chart per answer. First row: the riding's estimate (dot) and its 90% interval (bar), with the official result as a white line for the vote. Below: the province (white dot) and Canada (maple leaf). Values in %.",
          "Un graphique par réponse. Première ligne : l'estimation de la circonscription (point) et son intervalle à 90 % (barre), avec le résultat officiel en trait blanc pour le vote. Dessous : la province (point blanc) et le Canada (feuille d'érable). Valeurs en %.",
        )}
      </p>
      <SimilarRidings similar={riding.similar} />
      <ModelCheck estimates={estimates} />
    </div>
  );
}
