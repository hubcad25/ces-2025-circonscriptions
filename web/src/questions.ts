import { PARTIES } from "./parties";

export type Category = { code: string; color: string };

// Attitude questions will be added here at step 9, each with its answer categories.
export const QUESTIONS: { code: string; label: string; categories: Category[] }[] = [
  { code: "vote_post", label: "Reported vote (post-election wave)", categories: PARTIES },
  { code: "vote_pre", label: "Vote intention (pre-election wave)", categories: PARTIES },
];
