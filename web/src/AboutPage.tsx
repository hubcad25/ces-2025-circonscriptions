import { useLang } from "./i18n";

function AboutEnglish() {
  return (
    <div className="about">
      <h1>About</h1>
      <p className="subtitle">What this site shows, how it was made, and how much to trust it.</p>

      <h2>What is this?</h2>
      <p>
        Estimates of how people in each of Canada's 343 ridings voted in 2025, and what they think
        about 37 political questions: housing, the US, immigration, democracy, and more.
      </p>
      <p>
        They come from the <a href="https://doi.org/10.7910/DVN/2YAQ8D">2025 Canadian Election
        Study</a>, a large academic survey of about 20,000 Canadians.
      </p>

      <h2>Isn't that too few people per riding?</h2>
      <p>
        Yes. That is about 58 respondents per riding, sometimes fewer than 10. Averaging them
        directly would give noisy numbers.
      </p>
      <p>
        So the site uses a method called MRP (multilevel regression and poststratification). In
        plain words:
      </p>
      <ol>
        <li>
          A model learns how answers vary with age, gender, education, mother tongue, 2021 vote,
          province, and a few riding traits.
        </li>
        <li>
          The census says how many people of each kind live in each riding.
        </li>
        <li>
          The riding estimate is the model's answer for each group, weighted by how many people
          of that group live there.
        </li>
      </ol>
      <p>
        A riding with few respondents borrows strength from similar people elsewhere. That makes
        the estimates stable, but it also pulls them toward what is typical for people like its
        residents.
      </p>

      <h2>How accurate is it?</h2>
      <p>
        The vote is the one question we can check against reality. Compared with the official
        2025 results, estimates are off by about 4 points on average. The{" "}
        <a href="#/validation">Validation</a> tab shows every riding.
      </p>
      <p>
        Each estimate comes with a 90% range. Raw model ranges were too narrow, so they were
        widened until they matched the vote results. Attitudes are assumed to be as reliable as
        the vote, which cannot be checked.
      </p>

      <h2>Known limits</h2>
      <ul>
        <li>
          People whose mother tongue is neither English nor French are underrepresented in the
          survey (7% of respondents, 23% of adults).
        </li>
        <li>
          A riding that differs from others with a similar profile, for local reasons, will be
          smoothed out.
        </li>
        <li>Small gaps between two ridings usually mean nothing. Look at the ranges.</li>
      </ul>

      <h2>Who made this?</h2>
      <p>
        Hubert Cadieux. The code and data sources are on{" "}
        <a href="https://github.com/hubcad25/ces-2025-circonscriptions">GitHub</a>. This is an
        independent project, not affiliated with the Canadian Election Study team.
      </p>
    </div>
  );
}

function AboutFrench() {
  return (
    <div className="about">
      <h1>À propos</h1>
      <p className="subtitle">Ce que montre ce site, comment il a été fait et à quel point s'y fier.</p>

      <h2>C'est quoi ?</h2>
      <p>
        Des estimations du vote de 2025 dans chacune des 343 circonscriptions du Canada, et de ce
        que les gens y pensent sur 37 questions politiques : logement, États-Unis, immigration,
        démocratie, et plus.
      </p>
      <p>
        Elles viennent de l'<a href="https://doi.org/10.7910/DVN/2YAQ8D">Étude électorale
        canadienne 2025</a>, un grand sondage universitaire auprès d'environ 20 000 Canadiens.
      </p>

      <h2>Ce n'est pas trop peu de monde par circonscription ?</h2>
      <p>
        Oui. Ça fait environ 58 répondants par circonscription, parfois moins de 10. En faire
        directement la moyenne donnerait des chiffres très bruités.
      </p>
      <p>
        Le site utilise donc une méthode appelée MRP (régression multiniveau et
        poststratification). En mots simples :
      </p>
      <ol>
        <li>
          Un modèle apprend comment les réponses varient selon l'âge, le genre, la scolarité, la
          langue maternelle, le vote de 2021, la province et quelques traits de la circonscription.
        </li>
        <li>Le recensement dit combien de gens de chaque profil vivent dans chaque circonscription.</li>
        <li>
          L'estimation d'une circonscription est la réponse du modèle pour chaque profil, pondérée
          par le nombre de gens de ce profil qui y vivent.
        </li>
      </ol>
      <p>
        Une circonscription avec peu de répondants s'appuie sur des gens semblables ailleurs. Les
        estimations sont donc stables, mais elles sont aussi tirées vers ce qui est typique pour
        des gens comme ses habitants.
      </p>

      <h2>C'est précis à quel point ?</h2>
      <p>
        Le vote est la seule question qu'on peut comparer à la réalité. Par rapport aux résultats
        officiels de 2025, les estimations s'écartent d'environ 4 points en moyenne. L'onglet{" "}
        <a href="#/validation">Validation</a> montre chaque circonscription.
      </p>
      <p>
        Chaque estimation vient avec un intervalle de 90 %. Les intervalles bruts du modèle
        étaient trop étroits : ils ont été élargis jusqu'à concorder avec les résultats du vote.
        On suppose que les attitudes sont aussi fiables que le vote, ce qu'on ne peut pas vérifier.
      </p>

      <h2>Limites connues</h2>
      <ul>
        <li>
          Les gens dont la langue maternelle n'est ni l'anglais ni le français sont
          sous-représentés dans le sondage (7 % des répondants, 23 % des adultes).
        </li>
        <li>
          Une circonscription qui se distingue des autres au profil semblable, pour des raisons
          locales, sera lissée.
        </li>
        <li>
          De petits écarts entre deux circonscriptions ne veulent souvent rien dire. Regardez les
          intervalles.
        </li>
      </ul>

      <h2>Qui a fait ça ?</h2>
      <p>
        Hubert Cadieux. Le code et les sources de données sont sur{" "}
        <a href="https://github.com/hubcad25/ces-2025-circonscriptions">GitHub</a>. C'est un projet
        indépendant, sans lien avec l'équipe de l'Étude électorale canadienne.
      </p>
    </div>
  );
}

export default function AboutPage() {
  const { lang } = useLang();
  return lang === "fr" ? <AboutFrench /> : <AboutEnglish />;
}
