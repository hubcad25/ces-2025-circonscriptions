import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { useEffect, useState } from "react";
import { useLang } from "./i18n";
import { provinceLabel } from "./provinces";
import { QUESTIONS } from "./questions";
import namesQuery from "./riding_names.sql?raw";
import { loadFeatures, type Neighbour, rankRidings, type RidingFeatures } from "./similar";

// A question asked in one province only cannot compare ridings across Canada.
const ATTITUDES = QUESTIONS.filter((question) => question.isOrdinal && !question.province);
const LIST_LENGTH = 10;

// Each button compares ridings on a few question themes; "all" uses every attitude.
const TOPICS: { code: string; label: [string, string]; themes: string[] | null }[] = [
  { code: "all", label: ["All attitudes", "Toutes les attitudes"], themes: null },
  {
    code: "economy",
    label: ["Government and economy", "État et économie"],
    themes: ["Role of government", "Economy", "Canada and the United States"],
  },
  {
    code: "social",
    label: ["Social values", "Valeurs sociales"],
    themes: ["Social values", "Indigenous peoples"],
  },
  {
    code: "immigration",
    label: ["Immigration and language", "Immigration et langue"],
    themes: ["Immigration and language"],
  },
  { code: "democracy", label: ["Democracy and trust", "Démocratie et confiance"], themes: ["Democracy and trust"] },
];

function featureWeights(themes: string[] | null): Map<string, number> {
  return new Map(
    ATTITUDES.map((question) => [
      question.code,
      themes === null || themes.includes(question.theme.en) ? 1 : 0,
    ]),
  );
}

type Name = { fed23_name: string; province: string };

async function loadNames(con: AsyncDuckDBConnection): Promise<Map<number, Name>> {
  const result = await con.query(namesQuery);
  return new Map(result.toArray().map((row) => [row.fed23, row.toJSON() as Name]));
}

type ListProps = { title: string; ridings: Neighbour[]; names: Map<number, Name> };

function RidingList({ title, ridings, names }: ListProps) {
  const { lang } = useLang();
  return (
    <div>
      <h3>{title}</h3>
      <ol className="similar-list">
        {ridings.map((riding) => (
          <li key={riding.fed23}>
            <a href={`#/riding/${riding.fed23}`}>{names.get(riding.fed23)?.fed23_name}</a>{" "}
            <span className="province">{provinceLabel(names.get(riding.fed23)?.province ?? "", lang)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Props = { con: AsyncDuckDBConnection; fed23: number };

export default function SimilarRidings({ con, fed23 }: Props) {
  const { t } = useLang();
  const [ridings, setRidings] = useState<Map<number, RidingFeatures> | null>(null);
  const [names, setNames] = useState<Map<number, Name>>(new Map());
  const [topic, setTopic] = useState(TOPICS[0]);

  useEffect(() => {
    loadFeatures(con).then(setRidings);
    loadNames(con).then(setNames);
  }, [con]);

  if (ridings === null || !ridings.has(fed23)) return null;
  const ranked = rankRidings(fed23, ridings, featureWeights(topic.themes));

  return (
    <section id="similar" className="similar">
      <h2>{t("Similar and different ridings", "Circonscriptions semblables et différentes")}</h2>
      <div className="controls">
        <span className="controls-label">{t("Compare on", "Comparer selon")}</span>
        {TOPICS.map((option) => (
          <button
            key={option.code}
            className="wave"
            aria-pressed={option === topic}
            onClick={() => setTopic(option)}
          >
            {t(...option.label)}
          </button>
        ))}
      </div>
      <div className="similar-columns">
        <RidingList
          title={t("Most similar", "Les plus semblables")}
          ridings={ranked.slice(0, LIST_LENGTH)}
          names={names}
        />
        <RidingList
          title={t("Most different", "Les plus différentes")}
          ridings={ranked.slice(-LIST_LENGTH).reverse()}
          names={names}
        />
      </div>
    </section>
  );
}
