import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadHistory, loadSettings, nextId, saveHistory, saveSettings } from "./history";
import type { AskedQuestion } from "./types";

// Mock localStorage
const store: Record<string, string> = {};

beforeEach(() => {
  // Clear the in-memory store
  for (const key of Object.keys(store)) delete store[key];

  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  });
});

describe("loadHistory / saveHistory", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("round-trips a history array through save and load", () => {
    const history: AskedQuestion[] = [
      {
        id: "q-1",
        type: "radar",
        distance: 5,
        label: "5 Miles",
        center: [43.65, -79.38],
        answer: "yes",
        timestamp: 1700000000000,
      },
      {
        id: "q-2",
        type: "thermometer",
        distance: 3,
        label: "3 Miles",
        start: [43.65, -79.38],
        end: [43.7, -79.42],
        answer: "colder",
        timestamp: 1700000001000,
      },
    ];

    saveHistory(history);
    const loaded = loadHistory();
    expect(loaded).toEqual(history);
  });

  it("returns an empty array on corrupt JSON", () => {
    store["jetlag-questions"] = "{not valid json";
    expect(loadHistory()).toEqual([]);
  });
});

describe("loadSettings / saveSettings", () => {
  it("returns default settings when nothing is stored", () => {
    expect(loadSettings()).toEqual({ showRemoved: false });
  });

  it("round-trips settings through save and load", () => {
    saveSettings({ showRemoved: true });
    expect(loadSettings()).toEqual({ showRemoved: true });
  });

  it("returns default settings on corrupt JSON", () => {
    store["jetlag-question-settings"] = "{broken";
    expect(loadSettings()).toEqual({ showRemoved: false });
  });
});

describe("nextId", () => {
  it("returns a string starting with 'q-'", () => {
    expect(nextId()).toMatch(/^q-/);
  });

  it("returns unique IDs on successive calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(nextId());
    }
    expect(ids.size).toBe(100);
  });
});
