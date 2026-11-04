import { PARTIES } from "./parties";

// Not a survey question: the official 2025 vote share, shown for comparison with the estimates.
export const OFFICIAL_RESULTS = "official_results";

export type Category = { code: string; label: string; color: string };

// Ordinal questions can also be read as their mean position on the scale (answers ranked from
// 1) or, with groups, as grouped answers; codes come from analytics.fed_summaries.
export type Question = {
  code: string;
  label: string;
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

// Codes match analytics.mrp_outcomes; categories are listed in scale order. Attitudes come
// first, then the vote questions.
export const QUESTIONS: Question[] = [
  {
    code: "immigration",
    label: "Canada should admit more, fewer or the same number of immigrants",
    categories: [
      { code: "fewer", label: "Fewer", color: LOW },
      { code: "same", label: "Same", color: MIDDLE },
      { code: "more", label: "More", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Fewer immigrants", "More immigrants"],
  },
  {
    code: "spend_defence",
    label: "Federal spending on defence should be...",
    categories: [
      { code: "less", label: "Less", color: LOW },
      { code: "same", label: "Same", color: MIDDLE },
      { code: "more", label: "More", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Less defence spending", "More defence spending"],
  },
  {
    code: "bilingualism",
    label: "We have gone too far in pushing bilingualism in Canada",
    categories: AGREEMENT,
    groups: [
      { code: "grouped_low", label: "Disagree", color: LOW },
      { code: "grouped_middle", label: "Neither", color: MIDDLE },
      { code: "grouped_high", label: "Agree", color: HIGH },
    ],
    isOrdinal: true,
    ends: ["Bilingualism has not gone too far", "Bilingualism has gone too far"],
  },
  { code: "vote_post", label: "Reported vote (post-election wave)", categories: VOTE_CATEGORIES },
  { code: "vote_pre", label: "Vote intention (pre-election wave)", categories: VOTE_CATEGORIES },
  { code: OFFICIAL_RESULTS, label: "Official results 2025", categories: VOTE_CATEGORIES },
];
