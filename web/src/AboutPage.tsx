import { useLang } from "./i18n";
import { QUESTIONS } from "./questions";

// The vote questions are not counted: only the attitudes, which have an answer scale.
const ATTITUDE_COUNT = QUESTIONS.filter((question) => question.isOrdinal).length;

const CES_URL = "https://doi.org/10.7910/DVN/2YAQ8D";
const GITHUB_URL = "https://github.com/hubcad25/ces-2025-circonscriptions";

function AboutEnglish() {
  return (
    <div className="about">
      <h1>About</h1>

      <h2>Data</h2>
      <p>
        This site estimates, for each of Canada's 343 federal ridings, the 2025 vote and the
        answers to {ATTITUDE_COUNT} opinion questions from the{" "}
        <a href={CES_URL}>2025 Canadian Election Study</a>. The survey has about 20,000
        respondents: around 60 per riding on average, sometimes fewer than 10. That is too few for
        a simple average.
      </p>

      <h2>Method</h2>
      <p>
        The estimates come from multilevel regression and poststratification (MRP). The model
        learns how answers vary with age, gender, education, mother tongue and 2021 vote, and with
        the province, the region and a few traits of the riding. The census then gives the number
        of adults of each profile in each riding, and the estimate is the average of the
        predictions, weighted by those counts.
      </p>
      <p>
        A riding with few respondents thus borrows from similar people elsewhere. Its estimates
        are more stable, but closer to those of ridings with a similar profile.
      </p>

      <h2>Accuracy</h2>
      <p>
        The vote is the only question with a real result to compare with. Against the official
        2025 results, estimates are off by about 4 points on average, per party and riding (see{" "}
        <a href="#/validation">Validation</a>).
      </p>
      <p>
        The model's 90% intervals were too narrow for the vote. They were widened by a factor
        calibrated on those results, and the same factor is applied to the attitudes.
      </p>
      <p>
        The attitudes have no official result. Nationally, the model stays within 0.08 point of
        the survey's weighted average on every question.
      </p>

      <h2>Limits</h2>
      <ul>
        <li>
          People whose mother tongue is neither English nor French are 7% of respondents, against
          23% of adults.
        </li>
        <li>A gap specific to one riding, for a local reason, is partly smoothed out.</li>
        <li>A small gap between two ridings is often within the margin of error: compare the intervals.</li>
        <li>
          The survey places respondents in the 2013 ridings. Estimates for the 2023 ridings are
          recomputed from them, according to where people live.
        </li>
        <li>The question on Quebec sovereignty was asked in Quebec only.</li>
      </ul>

      <h2>Code</h2>
      <p>
        Python and SQL load the survey, the census and the election results into DuckDB. The model
        is fitted with numpyro, and the site uses React and MapLibre. Code and sources are on{" "}
        <a href={GITHUB_URL}>GitHub</a>.
      </p>
      <p>
        An independent project by Hubert Cadieux, not affiliated with the Canadian Election Study
        team.
      </p>
    </div>
  );
}

function AboutFrench() {
  return (
    <div className="about">
      <h1>À propos</h1>

      <h2>Données</h2>
      <p>
        Ce site estime, pour chacune des 343 circonscriptions fédérales, le vote de 2025 et les
        réponses à {ATTITUDE_COUNT} questions d'opinion de l'
        <a href={CES_URL}>Étude électorale canadienne 2025</a>. Le sondage compte environ 20 000
        répondants, soit une soixantaine par circonscription en moyenne, parfois moins de 10. C'est
        trop peu pour une simple moyenne.
      </p>

      <h2>Méthode</h2>
      <p>
        Les estimations viennent d'une régression multiniveau avec poststratification (MRP). Le
        modèle apprend comment les réponses varient selon l'âge, le genre, la scolarité, la langue
        maternelle et le vote de 2021, ainsi que selon la province, la région et quelques
        caractéristiques de la circonscription. Le recensement donne ensuite le nombre d'adultes de
        chaque profil dans chaque circonscription, et l'estimation est la moyenne des prédictions,
        pondérée par ces effectifs.
      </p>
      <p>
        Une circonscription avec peu de répondants emprunte donc aux gens semblables ailleurs. Ses
        estimations sont plus stables, mais plus proches de celles des circonscriptions au profil
        semblable.
      </p>

      <h2>Précision</h2>
      <p>
        Le vote est la seule question qu'on peut comparer à un résultat réel. Par rapport aux
        résultats officiels de 2025, l'écart moyen est d'environ 4 points par parti et par
        circonscription (voir <a href="#/validation">Validation</a>).
      </p>
      <p>
        Les intervalles à 90 % du modèle étaient trop étroits pour le vote. Ils ont été élargis
        d'un facteur calibré sur ces résultats, et le même facteur s'applique aux attitudes.
      </p>
      <p>
        Les attitudes n'ont pas de résultat officiel. À l'échelle du Canada, le modèle reste à
        0,08 point ou moins de la moyenne pondérée du sondage, pour chaque question.
      </p>

      <h2>Limites</h2>
      <ul>
        <li>
          Les personnes dont la langue maternelle n'est ni l'anglais ni le français forment 7 % des
          répondants, contre 23 % des adultes.
        </li>
        <li>Un écart propre à une circonscription, pour une raison locale, est en partie lissé.</li>
        <li>
          Un petit écart entre deux circonscriptions est souvent dans la marge d'erreur : comparez
          les intervalles.
        </li>
        <li>
          Le sondage situe les répondants dans les circonscriptions de 2013. Les estimations pour
          celles de 2023 en sont recalculées selon la répartition de la population.
        </li>
        <li>La question sur la souveraineté du Québec n'a été posée qu'au Québec.</li>
      </ul>

      <h2>Code</h2>
      <p>
        Python et SQL chargent le sondage, le recensement et les résultats électoraux dans DuckDB.
        Le modèle est ajusté avec numpyro, et le site utilise React et MapLibre. Le code et les
        sources sont sur <a href={GITHUB_URL}>GitHub</a> (en anglais).
      </p>
      <p>
        Projet indépendant de Hubert Cadieux, sans lien avec l'équipe de l'Étude électorale
        canadienne.
      </p>
    </div>
  );
}

export default function AboutPage() {
  const { lang } = useLang();
  return lang === "fr" ? <AboutFrench /> : <AboutEnglish />;
}
