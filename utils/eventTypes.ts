export const availableTypes = [
  "concert",
  "spectacle",
  "soiree_a_theme",
  "expo",
  "autre",
] as const;
export type EventType = (typeof availableTypes)[number];

export const typeLabels: Record<EventType, string> = {
  concert: "Concert",
  spectacle: "Spectacle",
  soiree_a_theme: "Soirée à thème",
  expo: "Exposition",
  autre: "Autre",
};