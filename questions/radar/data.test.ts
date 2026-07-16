import { describe, expect, it } from "vitest";
import { radarQuestions } from "./data";

describe("radarQuestions", () => {
  it("contains a non-empty array of definitions", () => {
    expect(radarQuestions.length).toBeGreaterThan(0);
  });

  it("every entry has type 'radar'", () => {
    for (const q of radarQuestions) {
      expect(q.type).toBe("radar");
    }
  });

  it("every entry has a positive distance", () => {
    for (const q of radarQuestions) {
      expect(q.distance).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label", () => {
    for (const q of radarQuestions) {
      expect(q.label.length).toBeGreaterThan(0);
    }
  });

  it("distances are sorted ascending", () => {
    const distances = radarQuestions.map((q) => q.distance);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });

  it("distances are unique", () => {
    const distances = radarQuestions.map((q) => q.distance);
    expect(new Set(distances).size).toBe(distances.length);
  });

  it("includes the ¼ mile question", () => {
    expect(radarQuestions).toContainEqual({
      type: "radar",
      distance: 0.25,
      label: "¼ Mile",
    });
  });

  it("includes the 10 mile question", () => {
    expect(radarQuestions).toContainEqual({
      type: "radar",
      distance: 10,
      label: "10 Miles",
    });
  });
});
