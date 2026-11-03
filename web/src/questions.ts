import { PARTIES } from "./parties";

export type Category = { code: string; label: string; color: string };

export type Question = { code: string; label: string; categories: Category[] };

const VOTE_CATEGORIES = PARTIES.map((party) => ({ ...party, label: party.code }));

// Ordered answers use blue for the low end, grey for the middle and orange for the high end.
const LOW = "#2e90fa";
const MIDDLE = "#98a2b3";
const HIGH = "#f79009";

const AGREEMENT: Category[] = [
  { code: "strongly_disagree", label: "Strongly disagree", color: LOW },
  { code: "somewhat_disagree", label: "Somewhat disagree", color: "#84adff" },
  { code: "neither", label: "Neither", color: MIDDLE },
  { code: "somewhat_agree", label: "Somewhat agree", color: "#fdb022" },
  { code: "strongly_agree", label: "Strongly agree", color: HIGH },
];

// Codes match analytics.mrp_outcomes; categories are listed in scale order.
export const QUESTIONS: Question[] = [
  { code: "vote_post", label: "Reported vote (post-election wave)", categories: VOTE_CATEGORIES },
  { code: "vote_pre", label: "Vote intention (pre-election wave)", categories: VOTE_CATEGORIES },
  {
    code: "immigration",
    label: "Canada should admit more, fewer or the same number of immigrants",
    categories: [
      { code: "fewer", label: "Fewer", color: LOW },
      { code: "same", label: "Same", color: MIDDLE },
      { code: "more", label: "More", color: HIGH },
    ],
  },
  {
    code: "spend_defence",
    label: "Federal spending on defence should be...",
    categories: [
      { code: "less", label: "Less", color: LOW },
      { code: "same", label: "Same", color: MIDDLE },
      { code: "more", label: "More", color: HIGH },
    ],
  },
  {
    code: "bilingualism",
    label: "We have gone too far in pushing bilingualism in Canada",
    categories: AGREEMENT,
  },
];
