import type { Text } from "./i18n";
import { PARTIES } from "./parties";

// Not a survey question: the official 2025 vote share, shown for comparison with the estimates.
export const OFFICIAL_RESULTS = "official_results";

export type Category = { code: string; label: Text; color: string };

// Ordinal questions can also be read as their mean position on the scale (answers ranked from
// 1) or, with groups, as grouped answers; codes come from analytics.fed_summaries.
export type Question = {
  code: string;
  label: Text;
  // Questions are grouped by theme in the question menus, in the order of this list.
  theme: Text;
  categories: Category[];
  isOrdinal?: boolean;
  groups?: Category[];
  // What leaning toward each end of the scale means, for the map legend.
  ends?: [Text, Text];
};

const VOTE_CATEGORIES: Category[] = PARTIES;

// Ordered answers use blue for the low end, grey for the middle and orange for the high end.
export const LOW = "#2e90fa";
const MIDDLE = "#98a2b3";
export const HIGH = "#f79009";

const AGREEMENT: Category[] = [
  { code: "strongly_disagree", label: { en: "Strongly disagree", fr: "Fortement en désaccord" }, color: LOW },
  { code: "somewhat_disagree", label: { en: "Somewhat disagree", fr: "Plutôt en désaccord" }, color: "#84adff" },
  { code: "neither", label: { en: "Neither", fr: "Ni l'un ni l'autre" }, color: MIDDLE },
  { code: "somewhat_agree", label: { en: "Somewhat agree", fr: "Plutôt d'accord" }, color: "#fdb022" },
  { code: "strongly_agree", label: { en: "Strongly agree", fr: "Fortement d'accord" }, color: HIGH },
];

const AGREEMENT_GROUPS: Category[] = [
  { code: "grouped_low", label: { en: "Disagree", fr: "En désaccord" }, color: LOW },
  { code: "grouped_middle", label: { en: "Neither", fr: "Ni l'un ni l'autre" }, color: MIDDLE },
  { code: "grouped_high", label: { en: "Agree", fr: "D'accord" }, color: HIGH },
];

const AGREEMENT_NO_MIDDLE: Category[] = AGREEMENT.filter((category) => category.code !== "neither");

const SPENDING: Category[] = [
  { code: "less", label: { en: "Less", fr: "Moins" }, color: LOW },
  { code: "same", label: { en: "Same", fr: "Pareil" }, color: MIDDLE },
  { code: "more", label: { en: "More", fr: "Plus" }, color: HIGH },
];

// Codes match analytics.mrp_outcomes; categories are listed in scale order. Attitudes come
// first, then the vote questions.
export const QUESTIONS: Question[] = [
  {
    code: "spend_defence",
    label: { en: "Federal spending on defence should be...", fr: "Les dépenses fédérales en défense devraient être..." },
    theme: { en: "Role of government", fr: "Rôle de l'État" },
    categories: SPENDING,
    isOrdinal: true,
    ends: [{ en: "Less defence spending", fr: "Moins de dépenses en défense" }, { en: "More defence spending", fr: "Plus de dépenses en défense" }],
  },
  {
    code: "spend_environment",
    label: { en: "Federal spending on the environment should be...", fr: "Les dépenses fédérales en environnement devraient être..." },
    theme: { en: "Role of government", fr: "Rôle de l'État" },
    categories: SPENDING,
    isOrdinal: true,
    ends: [{ en: "Less environment spending", fr: "Moins de dépenses en environnement" }, { en: "More environment spending", fr: "Plus de dépenses en environnement" }],
  },
  {
    code: "decent_housing",
    label: { en: "The government has a responsibility to provide decent housing for all", fr: "Le gouvernement a la responsabilité d'offrir un logement décent à tous" },
    theme: { en: "Role of government", fr: "Rôle de l'État" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Government not responsible for housing", fr: "Le logement n'est pas la responsabilité de l'État" }, { en: "Government responsible for housing", fr: "Le logement est la responsabilité de l'État" }],
  },
  {
    code: "spend_education",
    label: { en: "Federal spending on education should be...", fr: "Les dépenses fédérales en éducation devraient être..." },
    theme: { en: "Role of government", fr: "Rôle de l'État" },
    categories: SPENDING,
    isOrdinal: true,
    ends: [{ en: "Less education spending", fr: "Moins de dépenses en éducation" }, { en: "More education spending", fr: "Plus de dépenses en éducation" }],
  },
  {
    code: "reduce_inequality",
    label: { en: "The government should take measures to reduce differences in income levels", fr: "Le gouvernement devrait prendre des mesures pour réduire les écarts de revenus" },
    theme: { en: "Role of government", fr: "Rôle de l'État" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Against reducing income gaps", fr: "Contre la réduction des écarts de revenus" }, { en: "For reducing income gaps", fr: "Pour la réduction des écarts de revenus" }],
  },
  {
    code: "private_jobs",
    label: { en: "The government should leave it entirely to the private sector to create jobs", fr: "Le gouvernement devrait laisser entièrement au secteur privé le soin de créer des emplois" },
    theme: { en: "Role of government", fr: "Rôle de l'État" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Government should create jobs", fr: "L'État devrait créer des emplois" }, { en: "Leave jobs to the private sector", fr: "Laisser les emplois au privé" }],
  },
  {
    code: "welfare_dependency",
    label: { en: "The welfare state makes people less willing to look after themselves", fr: "L'État-providence rend les gens moins enclins à se prendre en main" },
    theme: { en: "Role of government", fr: "Rôle de l'État" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Welfare state does not hurt", fr: "L'État-providence ne nuit pas" }, { en: "Welfare state makes people dependent", fr: "L'État-providence rend dépendant" }],
  },
  {
    code: "economy_past_year",
    label: { en: "Over the past year, has Canada's economy...", fr: "Au cours de la dernière année, l'économie du Canada..." },
    theme: { en: "Economy", fr: "Économie" },
    categories: [
      { code: "worse", label: { en: "Got worse", fr: "S'est détériorée" }, color: LOW },
      { code: "same", label: { en: "Stayed about the same", fr: "Est restée à peu près pareille" }, color: MIDDLE },
      { code: "better", label: { en: "Got better", fr: "S'est améliorée" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Economy got worse", fr: "L'économie s'est détériorée" }, { en: "Economy got better", fr: "L'économie s'est améliorée" }],
  },
  {
    code: "trade_jobs",
    label: { en: "International trade creates more jobs in Canada than it destroys", fr: "Le commerce international crée plus d'emplois au Canada qu'il n'en détruit" },
    theme: { en: "Economy", fr: "Économie" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Trade destroys jobs", fr: "Le commerce détruit des emplois" }, { en: "Trade creates jobs", fr: "Le commerce crée des emplois" }],
  },
  {
    code: "ties_us",
    label: { en: "Canada's ties with the United States should be...", fr: "Les liens du Canada avec les États-Unis devraient être..." },
    theme: { en: "Canada and the United States", fr: "Canada et États-Unis" },
    categories: [
      { code: "much_more_distant", label: { en: "Much more distant", fr: "Beaucoup plus distants" }, color: LOW },
      { code: "somewhat_more_distant", label: { en: "Somewhat more distant", fr: "Un peu plus distants" }, color: "#84adff" },
      { code: "same", label: { en: "About the same", fr: "À peu près pareils" }, color: MIDDLE },
      { code: "somewhat_closer", label: { en: "Somewhat closer", fr: "Un peu plus proches" }, color: "#fdb022" },
      { code: "much_closer", label: { en: "Much closer", fr: "Beaucoup plus proches" }, color: HIGH },
    ],
    groups: [
      { code: "grouped_low", label: { en: "More distant", fr: "Plus distants" }, color: LOW },
      { code: "grouped_middle", label: { en: "Same", fr: "Pareil" }, color: MIDDLE },
      { code: "grouped_high", label: { en: "Closer", fr: "Plus proches" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "More distant from the US", fr: "Plus distants des États-Unis" }, { en: "Closer to the US", fr: "Plus proches des États-Unis" }],
  },
  {
    code: "tariffs_us",
    label: { en: "Canada should impose retaliatory tariffs on the United States", fr: "Le Canada devrait imposer des tarifs de représailles aux États-Unis" },
    theme: { en: "Canada and the United States", fr: "Canada et États-Unis" },
    categories: [
      { code: "strongly_oppose", label: { en: "Strongly oppose", fr: "Fortement opposé" }, color: LOW },
      { code: "somewhat_oppose", label: { en: "Somewhat oppose", fr: "Plutôt opposé" }, color: "#84adff" },
      { code: "somewhat_support", label: { en: "Somewhat support", fr: "Plutôt favorable" }, color: "#fdb022" },
      { code: "strongly_support", label: { en: "Strongly support", fr: "Fortement favorable" }, color: HIGH },
    ],
    // No middle answer on this scale.
    groups: [
      { code: "grouped_low", label: { en: "Oppose", fr: "Opposé" }, color: LOW },
      { code: "grouped_high", label: { en: "Support", fr: "Favorable" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Oppose tariffs", fr: "Contre les tarifs" }, { en: "Support tariffs", fr: "Pour les tarifs" }],
  },
  {
    code: "spend_reconciliation",
    label: { en: "Federal spending on reconciliation with Indigenous peoples should be...", fr: "Les dépenses fédérales pour la réconciliation avec les peuples autochtones devraient être..." },
    theme: { en: "Indigenous peoples", fr: "Peuples autochtones" },
    categories: SPENDING,
    isOrdinal: true,
    ends: [{ en: "Less reconciliation spending", fr: "Moins de dépenses en réconciliation" }, { en: "More reconciliation spending", fr: "Plus de dépenses en réconciliation" }],
  },
  {
    code: "indigenous_deserve",
    label: { en: "Over the past few years, Indigenous peoples have gotten less than they deserve", fr: "Ces dernières années, les peuples autochtones ont reçu moins que ce qu'ils méritent" },
    theme: { en: "Indigenous peoples", fr: "Peuples autochtones" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Got what they deserve", fr: "Ont reçu ce qu'ils méritent" }, { en: "Got less than they deserve", fr: "Ont reçu moins que ce qu'ils méritent" }],
  },
  {
    code: "ban_abortion",
    label: { en: "Should abortion be banned?", fr: "L'avortement devrait-il être interdit?" },
    theme: { en: "Social values", fr: "Valeurs sociales" },
    categories: [
      { code: "no", label: { en: "No", fr: "Non" }, color: LOW },
      { code: "some_circumstances", label: { en: "In some circumstances", fr: "Dans certaines circonstances" }, color: MIDDLE },
      { code: "yes", label: { en: "Yes", fr: "Oui" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Against a ban", fr: "Contre l'interdiction" }, { en: "For a ban", fr: "Pour l'interdiction" }],
  },
  {
    code: "women_home",
    label: { en: "Society would be better off if fewer women worked outside the home", fr: "La société se porterait mieux si moins de femmes travaillaient à l'extérieur de la maison" },
    theme: { en: "Social values", fr: "Valeurs sociales" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Disagree", fr: "En désaccord" }, { en: "Agree", fr: "D'accord" }],
  },
  {
    code: "religion_importance",
    label: { en: "In your life, religion is...", fr: "Dans votre vie, la religion est..." },
    theme: { en: "Social values", fr: "Valeurs sociales" },
    categories: [
      { code: "not_at_all", label: { en: "Not important at all", fr: "Pas du tout importante" }, color: LOW },
      { code: "not_very", label: { en: "Not very important", fr: "Peu importante" }, color: "#84adff" },
      { code: "somewhat", label: { en: "Somewhat important", fr: "Assez importante" }, color: "#fdb022" },
      { code: "very", label: { en: "Very important", fr: "Très importante" }, color: HIGH },
    ],
    groups: [
      { code: "grouped_low", label: { en: "Not important", fr: "Pas importante" }, color: LOW },
      { code: "grouped_high", label: { en: "Important", fr: "Importante" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Religion less important", fr: "Religion moins importante" }, { en: "Religion more important", fr: "Religion plus importante" }],
  },
  {
    code: "equal_rights",
    label: { en: "We have gone too far in pushing equal rights in this country", fr: "On est allé trop loin dans la promotion de l'égalité des droits au pays" },
    theme: { en: "Social values", fr: "Valeurs sociales" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Equal rights have not gone too far", fr: "L'égalité des droits n'est pas allée trop loin" }, { en: "Equal rights have gone too far", fr: "L'égalité des droits est allée trop loin" }],
  },
  {
    code: "newer_lifestyles",
    label: { en: "Newer lifestyles are contributing to the breakdown of our society", fr: "Les nouveaux modes de vie contribuent à l'effritement de notre société" },
    theme: { en: "Social values", fr: "Valeurs sociales" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Disagree", fr: "En désaccord" }, { en: "Agree", fr: "D'accord" }],
  },
  {
    code: "family_values",
    label: { en: "This country would have many fewer problems if there was more emphasis on traditional family values", fr: "Ce pays aurait beaucoup moins de problèmes si on accordait plus d'importance aux valeurs familiales traditionnelles" },
    theme: { en: "Social values", fr: "Valeurs sociales" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Disagree", fr: "En désaccord" }, { en: "Agree", fr: "D'accord" }],
  },
  {
    code: "climate_change",
    label: { en: "Is climate change happening?", fr: "Les changements climatiques sont-ils réels?" },
    theme: { en: "Social values", fr: "Valeurs sociales" },
    categories: [
      { code: "no", label: { en: "No", fr: "Non" }, color: LOW },
      { code: "yes", label: { en: "Yes", fr: "Oui" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Not happening", fr: "Pas réels" }, { en: "Happening", fr: "Réels" }],
  },
  {
    code: "democracy_satisfaction",
    label: { en: "How satisfied are you with the way democracy works in Canada?", fr: "Êtes-vous satisfait du fonctionnement de la démocratie au Canada?" },
    theme: { en: "Democracy and trust", fr: "Démocratie et confiance" },
    categories: [
      { code: "not_at_all", label: { en: "Not at all satisfied", fr: "Pas du tout satisfait" }, color: LOW },
      { code: "not_very", label: { en: "Not very satisfied", fr: "Peu satisfait" }, color: "#84adff" },
      { code: "fairly", label: { en: "Fairly satisfied", fr: "Assez satisfait" }, color: "#fdb022" },
      { code: "very", label: { en: "Very satisfied", fr: "Très satisfait" }, color: HIGH },
    ],
    groups: [
      { code: "grouped_low", label: { en: "Not satisfied", fr: "Pas satisfait" }, color: LOW },
      { code: "grouped_high", label: { en: "Satisfied", fr: "Satisfait" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Less satisfied", fr: "Moins satisfaits" }, { en: "More satisfied", fr: "Plus satisfaits" }],
  },
  {
    code: "politicians_trustworthy",
    label: { en: "Most politicians are trustworthy", fr: "La plupart des politiciens sont dignes de confiance" },
    theme: { en: "Democracy and trust", fr: "Démocratie et confiance" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Distrust politicians", fr: "Méfiance envers les politiciens" }, { en: "Trust politicians", fr: "Confiance envers les politiciens" }],
  },
  {
    code: "politicians_lie",
    label: { en: "Politicians are willing to lie to get elected", fr: "Les politiciens sont prêts à mentir pour se faire élire" },
    theme: { en: "Democracy and trust", fr: "Démocratie et confiance" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Disagree", fr: "En désaccord" }, { en: "Agree", fr: "D'accord" }],
  },
  {
    code: "strong_leader",
    label: { en: "Having a strong leader in government is good for Canada even if the leader bends the rules", fr: "Avoir un chef fort au gouvernement est bon pour le Canada, même s'il contourne les règles" },
    theme: { en: "Democracy and trust", fr: "Démocratie et confiance" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Against a strong leader", fr: "Contre un chef fort" }, { en: "For a strong leader", fr: "Pour un chef fort" }],
  },
  {
    code: "no_say",
    label: { en: "People like me don't have any say about what the government does", fr: "Les gens comme moi n'ont pas leur mot à dire sur ce que fait le gouvernement" },
    theme: { en: "Democracy and trust", fr: "Démocratie et confiance" },
    categories: AGREEMENT_NO_MIDDLE,
    // No middle answer on this scale.
    groups: [
      { code: "grouped_low", label: { en: "Disagree", fr: "En désaccord" }, color: LOW },
      { code: "grouped_high", label: { en: "Agree", fr: "D'accord" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Have a say", fr: "Ont leur mot à dire" }, { en: "No say", fr: "N'ont pas leur mot à dire" }],
  },
  {
    code: "people_trusted",
    label: { en: "Generally speaking, can most people be trusted?", fr: "De façon générale, peut-on faire confiance à la plupart des gens?" },
    theme: { en: "Democracy and trust", fr: "Démocratie et confiance" },
    categories: [
      { code: "careful", label: { en: "You need to be very careful", fr: "On n'est jamais trop prudent" }, color: LOW },
      { code: "trusted", label: { en: "Most people can be trusted", fr: "On peut faire confiance à la plupart des gens" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Be careful", fr: "Prudence" }, { en: "People can be trusted", fr: "Confiance envers les gens" }],
  },
  {
    code: "province_treatment",
    label: { en: "In general, does the federal government treat your province...", fr: "En général, le gouvernement fédéral traite-t-il votre province..." },
    theme: { en: "Democracy and trust", fr: "Démocratie et confiance" },
    categories: [
      { code: "worse", label: { en: "Worse", fr: "Moins bien" }, color: LOW },
      { code: "same", label: { en: "The same as other provinces", fr: "Comme les autres provinces" }, color: MIDDLE },
      { code: "better", label: { en: "Better", fr: "Mieux" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Treated worse", fr: "Traitée moins bien" }, { en: "Treated better", fr: "Traitée mieux" }],
  },
  {
    code: "french_threatened",
    label: { en: "Is the French language threatened in Quebec?", fr: "La langue française est-elle menacée au Québec?" },
    theme: { en: "Immigration and language", fr: "Immigration et langue" },
    categories: [
      { code: "no", label: { en: "No", fr: "Non" }, color: LOW },
      { code: "yes", label: { en: "Yes", fr: "Oui" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Not threatened", fr: "Pas menacée" }, { en: "Threatened", fr: "Menacée" }],
  },
  {
    code: "immigration",
    label: { en: "Canada should admit more, fewer or the same number of immigrants", fr: "Le Canada devrait admettre plus, moins ou autant d'immigrants" },
    theme: { en: "Immigration and language", fr: "Immigration et langue" },
    categories: [
      { code: "fewer", label: { en: "Fewer", fr: "Moins" }, color: LOW },
      { code: "same", label: { en: "Same", fr: "Pareil" }, color: MIDDLE },
      { code: "more", label: { en: "More", fr: "Plus" }, color: HIGH },
    ],
    isOrdinal: true,
    ends: [{ en: "Fewer immigrants", fr: "Moins d'immigrants" }, { en: "More immigrants", fr: "Plus d'immigrants" }],
  },
  {
    code: "bilingualism",
    label: { en: "We have gone too far in pushing bilingualism in Canada", fr: "On est allé trop loin dans la promotion du bilinguisme au Canada" },
    theme: { en: "Immigration and language", fr: "Immigration et langue" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Bilingualism has not gone too far", fr: "Le bilinguisme n'est pas allé trop loin" }, { en: "Bilingualism has gone too far", fr: "Le bilinguisme est allé trop loin" }],
  },
  {
    code: "spend_immigrants",
    label: { en: "Federal spending on immigrants and minorities should be...", fr: "Les dépenses fédérales pour les immigrants et les minorités devraient être..." },
    theme: { en: "Immigration and language", fr: "Immigration et langue" },
    categories: SPENDING,
    isOrdinal: true,
    ends: [{ en: "Less immigrant spending", fr: "Moins de dépenses pour les immigrants" }, { en: "More immigrant spending", fr: "Plus de dépenses pour les immigrants" }],
  },
  {
    code: "immigrants_jobs",
    label: { en: "Immigrants take jobs away from other Canadians", fr: "Les immigrants enlèvent des emplois aux autres Canadiens" },
    theme: { en: "Immigration and language", fr: "Immigration et langue" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Disagree", fr: "En désaccord" }, { en: "Agree", fr: "D'accord" }],
  },
  {
    code: "immigrants_crime",
    label: { en: "Immigrants increase crime rates in Canada", fr: "Les immigrants font augmenter la criminalité au Canada" },
    theme: { en: "Immigration and language", fr: "Immigration et langue" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Disagree", fr: "En désaccord" }, { en: "Agree", fr: "D'accord" }],
  },
  {
    code: "immigrants_fit_in",
    label: { en: "Too many recent immigrants just don't want to fit in to Canadian society", fr: "Trop d'immigrants récents ne veulent tout simplement pas s'intégrer à la société canadienne" },
    theme: { en: "Immigration and language", fr: "Immigration et langue" },
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: [{ en: "Disagree", fr: "En désaccord" }, { en: "Agree", fr: "D'accord" }],
  },
  {
    code: "vote_post",
    label: { en: "Reported vote (post-election wave)", fr: "Vote déclaré (vague postélectorale)" },
    theme: { en: "Vote", fr: "Vote" },
    categories: VOTE_CATEGORIES,
  },
  {
    code: "vote_pre",
    label: { en: "Vote intention (pre-election wave)", fr: "Intention de vote (vague préélectorale)" },
    theme: { en: "Vote", fr: "Vote" },
    categories: VOTE_CATEGORIES,
  },
  {
    code: OFFICIAL_RESULTS,
    label: { en: "Official results 2025", fr: "Résultats officiels 2025" },
    theme: { en: "Vote", fr: "Vote" },
    categories: VOTE_CATEGORIES,
  },
];
