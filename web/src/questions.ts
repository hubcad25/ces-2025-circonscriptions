import { PARTIES } from "./parties";

// Not a survey question: the official 2025 vote share, shown for comparison with the estimates.
export const OFFICIAL_RESULTS = "official_results";

export type Category = { code: string; label: string; color: string };

// Ordinal questions can also be read as their mean position on the scale (answers ranked from
// 1) or, with groups, as grouped answers; codes come from analytics.fed_summaries.
export type Question = {
  code: string;
  label: string;
  // Questions are grouped by theme in the question menus, in the order of this list.
  theme: string;
  categories: Category[];
  isOrdinal?: boolean;
  groups?: Category[];
  // What leaning toward each end of the scale means, for the map legend.
  ends?: [string, string];
};

const VOTE_CATEGORIES = PARTIES.map((party) => ({ ...party, label: party.code }));

// Ordered answers use blue for the low end, grey for the middle and orange for the high end.
export const LOW = "#2e90fa";
const MIDDLE = "#98a2b3";
export const HIGH = "#f79009";

const AGREEMENT: Category[] = [
  { code: "strongly_disagree", label: "Strongly disagree", color: LOW },
  { code: "somewhat_disagree", label: "Somewhat disagree", color: "#84adff" },
  { code: "neither", label: "Neither", color: MIDDLE },
  { code: "somewhat_agree", label: "Somewhat agree", color: "#fdb022" },
  { code: "strongly_agree", label: "Strongly agree", color: HIGH },
];

const AGREEMENT_GROUPS: Category[] = [
  { code: "grouped_low", label: "Disagree", color: LOW },
  { code: "grouped_middle", label: "Neither", color: MIDDLE },
  { code: "grouped_high", label: "Agree", color: HIGH },
];

const AGREEMENT_NO_MIDDLE: Category[] = AGREEMENT.filter((category) => category.code !== "neither");

const SPENDING: Category[] = [
  { code: "less", label: "Less", color: LOW },
  { code: "same", label: "Same", color: MIDDLE },
  { code: "more", label: "More", color: HIGH },
];

// Codes match analytics.mrp_outcomes; categories are listed in scale order. Attitudes come
// first, then the vote questions.
export const QUESTIONS: Question[] = [
  {
    code: "spend_defence",
    label: "Federal spending on defence should be...",
    theme: "Role of government",
    categories: SPENDING,
    isOrdinal: true,
    ends: ["Less defence spending", "More defence spending"],
  },
  {
    code: "spend_environment",
    label: "Federal spending on the environment should be...",
    theme: "Role of government",
    categories: SPENDING,
    isOrdinal: true,
    ends: ["Less environment spending", "More environment spending"],
  },
  {
    code: "decent_housing",
    label: "The government has a responsibility to provide decent housing for all",
    theme: "Role of government",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Government not responsible for housing", "Government responsible for housing"],
  },
  {
    code: "spend_education",
    label: "Federal spending on education should be...",
    theme: "Role of government",
    categories: SPENDING,
    isOrdinal: true,
    ends: ["Less education spending", "More education spending"],
  },
  {
    code: "reduce_inequality",
    label: "The government should take measures to reduce differences in income levels",
    theme: "Role of government",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Against reducing income gaps", "For reducing income gaps"],
  },
  {
    code: "private_jobs",
    label: "The government should leave it entirely to the private sector to create jobs",
    theme: "Role of government",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Government should create jobs", "Leave jobs to the private sector"],
  },
  {
    code: "welfare_dependency",
    label: "The welfare state makes people less willing to look after themselves",
    theme: "Role of government",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Welfare state does not hurt", "Welfare state makes people dependent"],
  },
  {
    code: "economy_past_year",
    label: "Over the past year, has Canada's economy...",
    theme: "Economy",
    categories: [
      { code: "worse", label: "Got worse", color: LOW },
      { code: "same", label: "Stayed about the same", color: MIDDLE },
      { code: "better", label: "Got better", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Economy got worse", "Economy got better"],
  },
  {
    code: "trade_jobs",
    label: "International trade creates more jobs in Canada than it destroys",
    theme: "Economy",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Trade destroys jobs", "Trade creates jobs"],
  },
  {
    code: "ties_us",
    label: "Canada's ties with the United States should be...",
    theme: "Canada and the United States",
    categories: [
      { code: "much_more_distant", label: "Much more distant", color: LOW },
      { code: "somewhat_more_distant", label: "Somewhat more distant", color: "#84adff" },
      { code: "same", label: "About the same", color: MIDDLE },
      { code: "somewhat_closer", label: "Somewhat closer", color: "#fdb022" },
      { code: "much_closer", label: "Much closer", color: HIGH },
    ],
    groups: [
      { code: "grouped_low", label: "More distant", color: LOW },
      { code: "grouped_middle", label: "Same", color: MIDDLE },
      { code: "grouped_high", label: "Closer", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["More distant from the US", "Closer to the US"],
  },
  {
    code: "tariffs_us",
    label: "Canada should impose retaliatory tariffs on the United States",
    theme: "Canada and the United States",
    categories: [
      { code: "strongly_oppose", label: "Strongly oppose", color: LOW },
      { code: "somewhat_oppose", label: "Somewhat oppose", color: "#84adff" },
      { code: "somewhat_support", label: "Somewhat support", color: "#fdb022" },
      { code: "strongly_support", label: "Strongly support", color: HIGH },
    ],
    // No middle answer on this scale.
    groups: [
      { code: "grouped_low", label: "Oppose", color: LOW },
      { code: "grouped_high", label: "Support", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Oppose tariffs", "Support tariffs"],
  },
  {
    code: "spend_reconciliation",
    label: "Federal spending on reconciliation with Indigenous peoples should be...",
    theme: "Indigenous peoples",
    categories: SPENDING,
    isOrdinal: true,
    ends: ["Less reconciliation spending", "More reconciliation spending"],
  },
  {
    code: "indigenous_deserve",
    label: "Over the past few years, Indigenous peoples have gotten less than they deserve",
    theme: "Indigenous peoples",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Got what they deserve", "Got less than they deserve"],
  },
  {
    code: "ban_abortion",
    label: "Should abortion be banned?",
    theme: "Social values",
    categories: [
      { code: "no", label: "No", color: LOW },
      { code: "some_circumstances", label: "In some circumstances", color: MIDDLE },
      { code: "yes", label: "Yes", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Against a ban", "For a ban"],
  },
  {
    code: "women_home",
    label: "Society would be better off if fewer women worked outside the home",
    theme: "Social values",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Disagree", "Agree"],
  },
  {
    code: "religion_importance",
    label: "In your life, religion is...",
    theme: "Social values",
    categories: [
      { code: "not_at_all", label: "Not important at all", color: LOW },
      { code: "not_very", label: "Not very important", color: "#84adff" },
      { code: "somewhat", label: "Somewhat important", color: "#fdb022" },
      { code: "very", label: "Very important", color: HIGH },
    ],
    groups: [
      { code: "grouped_low", label: "Not important", color: LOW },
      { code: "grouped_high", label: "Important", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Religion less important", "Religion more important"],
  },
  {
    code: "equal_rights",
    label: "We have gone too far in pushing equal rights in this country",
    theme: "Social values",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Equal rights have not gone too far", "Equal rights have gone too far"],
  },
  {
    code: "newer_lifestyles",
    label: "Newer lifestyles are contributing to the breakdown of our society",
    theme: "Social values",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Disagree", "Agree"],
  },
  {
    code: "family_values",
    label: "This country would have many fewer problems if there was more emphasis on traditional family values",
    theme: "Social values",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Disagree", "Agree"],
  },
  {
    code: "climate_change",
    label: "Is climate change happening?",
    theme: "Social values",
    categories: [
      { code: "no", label: "No", color: LOW },
      { code: "yes", label: "Yes", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Not happening", "Happening"],
  },
  {
    code: "democracy_satisfaction",
    label: "How satisfied are you with the way democracy works in Canada?",
    theme: "Democracy and trust",
    categories: [
      { code: "not_at_all", label: "Not at all satisfied", color: LOW },
      { code: "not_very", label: "Not very satisfied", color: "#84adff" },
      { code: "fairly", label: "Fairly satisfied", color: "#fdb022" },
      { code: "very", label: "Very satisfied", color: HIGH },
    ],
    groups: [
      { code: "grouped_low", label: "Not satisfied", color: LOW },
      { code: "grouped_high", label: "Satisfied", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Less satisfied", "More satisfied"],
  },
  {
    code: "politicians_trustworthy",
    label: "Most politicians are trustworthy",
    theme: "Democracy and trust",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Distrust politicians", "Trust politicians"],
  },
  {
    code: "politicians_lie",
    label: "Politicians are willing to lie to get elected",
    theme: "Democracy and trust",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Disagree", "Agree"],
  },
  {
    code: "strong_leader",
    label: "Having a strong leader in government is good for Canada even if the leader bends the rules",
    theme: "Democracy and trust",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Against a strong leader", "For a strong leader"],
  },
  {
    code: "no_say",
    label: "People like me don't have any say about what the government does",
    theme: "Democracy and trust",
    categories: AGREEMENT_NO_MIDDLE,
    // No middle answer on this scale.
    groups: [
      { code: "grouped_low", label: "Disagree", color: LOW },
      { code: "grouped_high", label: "Agree", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Have a say", "No say"],
  },
  {
    code: "people_trusted",
    label: "Generally speaking, can most people be trusted?",
    theme: "Democracy and trust",
    categories: [
      { code: "careful", label: "You need to be very careful", color: LOW },
      { code: "trusted", label: "Most people can be trusted", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Be careful", "People can be trusted"],
  },
  {
    code: "province_treatment",
    label: "In general, does the federal government treat your province...",
    theme: "Democracy and trust",
    categories: [
      { code: "worse", label: "Worse", color: LOW },
      { code: "same", label: "The same as other provinces", color: MIDDLE },
      { code: "better", label: "Better", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Treated worse", "Treated better"],
  },
  {
    code: "french_threatened",
    label: "Is the French language threatened in Quebec?",
    theme: "Immigration and language",
    categories: [
      { code: "no", label: "No", color: LOW },
      { code: "yes", label: "Yes", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Not threatened", "Threatened"],
  },
  {
    code: "immigration",
    label: "Canada should admit more, fewer or the same number of immigrants",
    theme: "Immigration and language",
    categories: [
      { code: "fewer", label: "Fewer", color: LOW },
      { code: "same", label: "Same", color: MIDDLE },
      { code: "more", label: "More", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Fewer immigrants", "More immigrants"],
  },
  {
    code: "bilingualism",
    label: "We have gone too far in pushing bilingualism in Canada",
    theme: "Immigration and language",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Bilingualism has not gone too far", "Bilingualism has gone too far"],
  },
  {
    code: "spend_immigrants",
    label: "Federal spending on immigrants and minorities should be...",
    theme: "Immigration and language",
    categories: SPENDING,
    isOrdinal: true,
    ends: ["Less immigrant spending", "More immigrant spending"],
  },
  {
    code: "immigrants_jobs",
    label: "Immigrants take jobs away from other Canadians",
    theme: "Immigration and language",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Disagree", "Agree"],
  },
  {
    code: "immigrants_crime",
    label: "Immigrants increase crime rates in Canada",
    theme: "Immigration and language",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Disagree", "Agree"],
  },
  {
    code: "immigrants_fit_in",
    label: "Too many recent immigrants just don't want to fit in to Canadian society",
    theme: "Immigration and language",
    categories: AGREEMENT,
    groups: AGREEMENT_GROUPS,
    isOrdinal: true,
    ends: ["Disagree", "Agree"],
  },
  {
    code: "vote_post",
    label: "Reported vote (post-election wave)",
    theme: "Vote",
    categories: VOTE_CATEGORIES,
  },
  {
    code: "vote_pre",
    label: "Vote intention (pre-election wave)",
    theme: "Vote",
    categories: VOTE_CATEGORIES,
  },
  {
    code: OFFICIAL_RESULTS,
    label: "Official results 2025",
    theme: "Vote",
    categories: VOTE_CATEGORIES,
  },
];
