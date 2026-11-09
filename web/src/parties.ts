import type { Text } from "./i18n";

// Short party names, as each language writes them.
export const PARTIES: { code: string; label: Text; color: string }[] = [
  { code: "LPC", label: { en: "LPC", fr: "PLC" }, color: "#d71920" },
  { code: "CPC", label: { en: "CPC", fr: "PCC" }, color: "#1a4782" },
  { code: "NDP", label: { en: "NDP", fr: "NPD" }, color: "#e8590c" },
  { code: "BQ", label: { en: "BQ", fr: "BQ" }, color: "#0f8bab" },
  { code: "OTH", label: { en: "Other", fr: "Autre" }, color: "#6b7178" },
];
