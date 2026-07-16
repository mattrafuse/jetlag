// ── Shared History & Settings Persistence ─────────────────────
// Pure localStorage helpers shared by both question types and the
// orchestrator. Kept at the top level so neither subfolder depends on
// the other.

import type { AskedQuestion } from "./types";

const STORAGE_KEY = "jetlag-questions";
const SETTINGS_KEY = "jetlag-question-settings";

/** Load the full question history from localStorage. */
export const loadHistory = (): AskedQuestion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AskedQuestion[];
  } catch {
    /* ignore corrupt data */
  }
  return [];
};

/** Persist the full question history to localStorage. */
export const saveHistory = (history: AskedQuestion[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export interface QuestionSettings {
  showRemoved: boolean;
}

/** Load the question settings (currently just `showRemoved`). */
export const loadSettings = (): QuestionSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as QuestionSettings;
  } catch {
    /* ignore corrupt data */
  }
  return { showRemoved: false };
};

/** Persist question settings to localStorage. */
export const saveSettings = (settings: QuestionSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// ── ID generation ──────────────────────────────────────────────
let questionCounter = 0;

/** Generate a unique question ID. */
export const nextId = (): string => `q-${Date.now()}-${++questionCounter}`;
