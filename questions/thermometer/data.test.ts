import { describe, expect, it } from "vitest";
import { thermometerQuestions } from "./data";

describe("thermometerQuestions", () => {
  it("contains a non-empty array of definitions", () => {
    expect(thermometerQuestions.length).toBeGreaterThan(0);
  });

  it("every entry has type 'thermometer'", () => {
    for (const q of thermometerQuestions) {
      expect(q.type).toBe("thermometer");
    }
  });

  it("every entry has a positive distance", () => {
    for (const q of thermometerQuestions) {
      expect(q.distance).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label", () => {
    for (const q of thermometerQuestions) {
      expect(q.label.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a valid gameSize", () => {
    const validSizes = new Set(["small", "medium", "large"]);
    for (const q of thermometerQuestions) {
      expect(validSizes.has(q.gameSize)).toBe(true);
    }
  });

  it("distances are sorted ascending", () => {
    const distances = thermometerQuestions.map((q) => q.distance);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });

  it("distances are unique", () => {
    const distances = thermometerQuestions.map((q) => q.distance);
    expect(new Set(distances).size).toBe(distances.length);
  });

  it("includes the ½ mile small question", () => {
    expect(thermometerQuestions).toContainEqual({
      type: "thermometer",
      distance: 0.5,
      label: "½ Mile",
      gameSize: "small",
    });
  });

  it("includes the 50 mile large question", () => {
    expect(thermometerQuestions).toContainEqual({
      type: "thermometer",
      distance: 50,
      label: "50 Miles",
      gameSize: "large",
    });
  });
});
