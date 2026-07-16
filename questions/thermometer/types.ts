// ── Thermometer Question Types ─────────────────────────────────

/** Static definition of a thermometer question card. */
export interface ThermometerQuestionDef {
  type: "thermometer";
  /** Travel distance in miles. */
  distance: number;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Recommended game size for this card. */
  gameSize: "small" | "medium" | "large";
}

/** A thermometer question that has been asked and answered (history entry). */
export interface AskedThermometerQuestion {
  id: string;
  type: "thermometer";
  /** Travel distance in miles. */
  distance: number;
  /** Human-readable label. */
  label: string;
  /** [lat, lng] of the start location. */
  start: [number, number];
  /** [lat, lng] of the end location. */
  end: [number, number];
  answer: "hotter" | "colder";
  timestamp: number;
}
