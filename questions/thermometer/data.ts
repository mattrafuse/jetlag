// ── Thermometer Question Data ───────────────────────────────────
// Format: "After traveling ____, am I hotter or colder?"
// Cost: hider draws 2 cards, keeps 1

import type { ThermometerQuestionDef } from "./types";

export const thermometerQuestions: ThermometerQuestionDef[] = [
  { type: "thermometer", distance: 0.5, label: "½ Mile", gameSize: "small" },
  { type: "thermometer", distance: 3, label: "3 Miles", gameSize: "small" },
  { type: "thermometer", distance: 10, label: "10 Miles", gameSize: "medium" },
  { type: "thermometer", distance: 50, label: "50 Miles", gameSize: "large" },
];
