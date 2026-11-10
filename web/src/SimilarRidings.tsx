import { useEffect, useState } from "react";
import { loadRidingNames, type Neighbours, type RidingName } from "./data";
import { useLang } from "./i18n";
import { provinceLabel } from "./provinces";

// Each button compares ridings on a few question themes; "all" uses every attitude. The topic of
// each attitude is set in sql/export/site_questions.sql and the lists in sql/export/similar.sql.
const TOPICS: { code: string; label: [string, string] }[] = [
  { code: "all", label: ["All attitudes", "Toutes les attitudes"] },
  { code: "economy", label: ["Government and economy", "État et économie"] },
  { code: "social", label: ["Social values", "Valeurs sociales"] },
  { code: "immigration", label: ["Immigration and language", "Immigration et langue"] },
  { code: "democracy", label: ["Democracy and trust", "Démocratie et confiance"] },
];

type ListProps = { title: string; ridings: number[]; names: Map<number, RidingName> };

function RidingList({ title, ridings, names }: ListProps) {
  const { lang } = useLang();
  return (
    <div>
      <h3>{title}</h3>
      <ol className="similar-list">
        {ridings.map((fed23) => (
          <li key={fed23}>
            <a href={`#/riding/${fed23}`}>{names.get(fed23)?.fed23_name}</a>{" "}
            <span className="province">{provinceLabel(names.get(fed23)?.province ?? "", lang)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function SimilarRidings({ similar }: { similar: Record<string, Neighbours> }) {
  const { t } = useLang();
  const [names, setNames] = useState<Map<number, RidingName> | null>(null);
  const [topic, setTopic] = useState(TOPICS[0]);

  useEffect(() => {
    loadRidingNames().then(setNames);
  }, []);

  if (names === null || !(topic.code in similar)) return null;

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
          ridings={similar[topic.code].similar}
          names={names}
        />
        <RidingList
          title={t("Most different", "Les plus différentes")}
          ridings={similar[topic.code].different}
          names={names}
        />
      </div>
    </section>
  );
}
