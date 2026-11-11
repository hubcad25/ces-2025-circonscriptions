import type { Text } from "./i18n";

// The dimensions of analytics.dimension_loadings: the left-right axis (0), then the rotated
// dimensions, numbered by the variance they explain. Every score leans to the right as it rises;
// the ends say what a lower or higher score means.
export type Dimension = { code: number; label: Text; ends: [Text, Text] };

// Not the colors of the answer scales (low and high) nor of a party.
export const LEFT = "#0e9f8e";
export const RIGHT = "#c45ad6";

export const DIMENSIONS: Dimension[] = [
  {
    code: 0,
    label: { en: "Left-right", fr: "Gauche-droite" },
    ends: [
      { en: "Further left", fr: "Plus à gauche" },
      { en: "Further right", fr: "Plus à droite" },
    ],
  },
  {
    code: 1,
    label: { en: "Immigration", fr: "Immigration" },
    ends: [
      { en: "More open to immigration", fr: "Plus ouverts à l'immigration" },
      { en: "More wary of immigration", fr: "Plus méfiants envers l'immigration" },
    ],
  },
  {
    code: 2,
    label: { en: "Redistribution and role of government", fr: "Redistribution et rôle de l'État" },
    ends: [
      { en: "Bigger role for government", fr: "Plus d'État" },
      { en: "Smaller role for government", fr: "Moins d'État" },
    ],
  },
  {
    code: 3,
    label: { en: "Social conservatism and religion", fr: "Conservatisme social et religion" },
    ends: [
      { en: "More socially liberal", fr: "Plus libéraux sur les mœurs" },
      { en: "More socially conservative", fr: "Plus conservateurs sur les mœurs" },
    ],
  },
  {
    code: 4,
    label: { en: "Trust in democracy", fr: "Confiance envers la démocratie" },
    ends: [
      { en: "More trust in democracy", fr: "Plus confiants envers la démocratie" },
      { en: "Less trust in democracy", fr: "Moins confiants envers la démocratie" },
    ],
  },
  {
    code: 5,
    label: { en: "French in Quebec", fr: "Le français au Québec" },
    ends: [
      { en: "French seen as threatened", fr: "Français perçu comme menacé" },
      { en: "French seen as secure", fr: "Français perçu comme en sécurité" },
    ],
  },
];
