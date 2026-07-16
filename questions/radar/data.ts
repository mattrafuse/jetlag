// ── Radar Question Data ────────────────────────────────────────
// Format: "Are you within ____ of me?" — Yes/No answer
// Cost: hider draws 2 cards, keeps 1

import type { RadarQuestionDef } from "./types";

export const radarQuestions: RadarQuestionDef[] = [
  { type: "radar", distance: 0.25, label: "¼ Mile" },
  { type: "radar", distance: 0.5, label: "½ Mile" },
  { type: "radar", distance: 1, label: "1 Mile" },
  { type: "radar", distance: 3, label: "3 Miles" },
  { type: "radar", distance: 5, label: "5 Miles" },
  { type: "radar", distance: 10, label: "10 Miles" },
];
