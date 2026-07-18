// ── Radar Question Types ───────────────────────────────────────

/** Static definition of a radar question card. */
export interface RadarQuestionDef {
  type: "radar";
  /** Radius in miles. */
  distance: number;
  /** Human-readable label shown in the UI (e.g. "¼ Mile"). */
  label: string;
}

/** A radar question that has been asked and answered (history entry). */
export interface AskedRadarQuestion {
  id: string;
  type: "radar";
  /** Radius in miles. */
  distance: number;
  /** Human-readable label. */
  label: string;
  /** [lat, lng] of the user's location when the question was asked. */
  center: [number, number];
  answer: "yes" | "no";
  timestamp: number;
  /** Number of stations removed by this question when it was asked. */
  removedCount?: number;
  /** Percentage of remaining stations removed by this question when asked. */
  removedPercent?: number;
}
