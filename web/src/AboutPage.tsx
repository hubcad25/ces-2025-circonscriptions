export default function AboutPage() {
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
