import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";
import { computeRadarExclusion } from "./exclusion";

const CENTER: [number, number] = [43.6532, -79.3832]; // Toronto [lat, lng]
const DISTANCE = 5; // miles

describe("computeRadarExclusion", () => {
  it("returns a Polygon feature for 'no'", () => {
    const result = computeRadarExclusion(CENTER, DISTANCE, "no");
    expect(result.geometry.type).toBe("Polygon");
  });

  it("returns a Polygon feature for 'yes'", () => {
    const result = computeRadarExclusion(CENTER, DISTANCE, "yes");
    expect(result.geometry.type).toBe("Polygon");
  });

  it("for 'no': the exclusion polygon is the circle itself (single ring)", () => {
    const result = computeRadarExclusion(CENTER, DISTANCE, "no");
    expect(result.geometry.coordinates).toHaveLength(1);
  });

  it("for 'yes': the exclusion polygon has an outer ring and a hole", () => {
    const result = computeRadarExclusion(CENTER, DISTANCE, "yes");
    expect(result.geometry.coordinates).toHaveLength(2);
  });

  it("for 'no': a point at the center is inside the exclusion zone", () => {
    const polygon = computeRadarExclusion(CENTER, DISTANCE, "no");
    const centerPoint = turf.point([CENTER[1], CENTER[0]]);
    expect(turf.booleanWithin(centerPoint, polygon)).toBe(true);
  });

  it("for 'no': a far-away point is outside the exclusion zone", () => {
    const polygon = computeRadarExclusion(CENTER, DISTANCE, "no");
    const farPoint = turf.point([CENTER[1] + 50, CENTER[0] + 50]);
    expect(turf.booleanWithin(farPoint, polygon)).toBe(false);
  });

  it("for 'yes': a far-away point is inside the exclusion zone (everything outside circle)", () => {
    const polygon = computeRadarExclusion(CENTER, DISTANCE, "yes");
    // Use a point far from the circle but within the world bounds (±90 lat, ±180 lng).
    const farPoint = turf.point([CENTER[1] + 50, CENTER[0] + 10]);
    expect(turf.booleanWithin(farPoint, polygon)).toBe(true);
  });

  it("for 'yes': the center point is NOT inside the exclusion zone (it's in the hole)", () => {
    const polygon = computeRadarExclusion(CENTER, DISTANCE, "yes");
    const centerPoint = turf.point([CENTER[1], CENTER[0]]);
    expect(turf.booleanWithin(centerPoint, polygon)).toBe(false);
  });

  it("produces a larger circle for a larger distance ('no')", () => {
    const small = computeRadarExclusion(CENTER, 1, "no");
    const large = computeRadarExclusion(CENTER, 50, "no");

    // A point 20 miles away should be outside the small circle but inside the large one.
    // 20 miles ≈ 0.29 degrees latitude
    const testPoint = turf.point([CENTER[1], CENTER[0] + 0.29]);
    expect(turf.booleanWithin(testPoint, small)).toBe(false);
    expect(turf.booleanWithin(testPoint, large)).toBe(true);
  });
});
