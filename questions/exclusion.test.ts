import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";
import { unionExclusionZones } from "./exclusion";

// Helper: create a simple square polygon at the given origin
const squarePolygon = (
  originLng: number,
  originLat: number,
  size = 1,
): GeoJSON.Feature<GeoJSON.Polygon> =>
  turf.polygon([
    [
      [originLng, originLat],
      [originLng + size, originLat],
      [originLng + size, originLat + size],
      [originLng, originLat + size],
      [originLng, originLat],
    ],
  ]);

describe("unionExclusionZones", () => {
  it("returns null for an empty array", () => {
    expect(unionExclusionZones([])).toBeNull();
  });

  it("returns the single polygon when given one zone", () => {
    const zone = squarePolygon(0, 0);
    const result = unionExclusionZones([zone]);
    expect(result).not.toBeNull();
    expect(result!.geometry.type).toBe("Polygon");
  });

  it("unions two overlapping polygons into a single polygon", () => {
    const a = squarePolygon(0, 0, 2);
    const b = squarePolygon(1, 0, 2);
    const result = unionExclusionZones([a, b]);
    expect(result).not.toBeNull();
    expect(result!.geometry.type).toBe("Polygon");
  });

  it("unions two disjoint polygons into a MultiPolygon", () => {
    const a = squarePolygon(0, 0);
    const b = squarePolygon(10, 10);
    const result = unionExclusionZones([a, b]);
    expect(result).not.toBeNull();
    expect(result!.geometry.type).toBe("MultiPolygon");
  });

  it("a point in either original polygon is within the union", () => {
    const a = squarePolygon(0, 0, 2);
    const b = squarePolygon(10, 10, 2);
    const result = unionExclusionZones([a, b]);
    expect(result).not.toBeNull();

    const pointInA = turf.point([0.5, 0.5]);
    const pointInB = turf.point([10.5, 10.5]);
    expect(turf.booleanWithin(pointInA, result!)).toBe(true);
    expect(turf.booleanWithin(pointInB, result!)).toBe(true);
  });

  it("a point in neither original polygon is not within the union", () => {
    const a = squarePolygon(0, 0, 1);
    const b = squarePolygon(10, 10, 1);
    const result = unionExclusionZones([a, b]);
    expect(result).not.toBeNull();

    const pointOutside = turf.point([5, 5]);
    expect(turf.booleanWithin(pointOutside, result!)).toBe(false);
  });

  it("handles three zones", () => {
    const a = squarePolygon(0, 0, 1);
    const b = squarePolygon(0.5, 0, 1);
    const c = squarePolygon(10, 10, 1);
    const result = unionExclusionZones([a, b, c]);
    expect(result).not.toBeNull();
    // a and b overlap, c is disjoint → MultiPolygon
    expect(result!.geometry.type).toBe("MultiPolygon");
  });

  // ── Regression: turf v7 union API ────────────────────────────
  // turf v7 changed `turf.union` to take a FeatureCollection instead of
  // two features. The old two-arg call threw silently inside a try/catch,
  // so only the first zone was ever kept. These tests verify the fix.
  it("actually merges two disjoint zones (regression for turf v7 API)", () => {
    const a = squarePolygon(0, 0, 1);
    const b = squarePolygon(10, 10, 1);
    const result = unionExclusionZones([a, b]);

    // If the union silently failed (old bug), result would be just `a`
    // and the point in `b` would NOT be within it.
    expect(result).not.toBeNull();
    const pointInB = turf.point([10.5, 10.5]);
    expect(turf.booleanWithin(pointInB, result!)).toBe(true);
  });

  it("actually merges three zones including disjoint ones (regression)", () => {
    const a = squarePolygon(0, 0, 1);
    const b = squarePolygon(2, 0, 1);
    const c = squarePolygon(20, 20, 1);
    const result = unionExclusionZones([a, b, c]);

    expect(result).not.toBeNull();
    // Point in the last (disjoint) zone must be in the union.
    // If only the first zone was kept, this would fail.
    const pointInC = turf.point([20.5, 20.5]);
    expect(turf.booleanWithin(pointInC, result!)).toBe(true);
  });

  it("merging many zones preserves all of them (regression)", () => {
    const zones: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
    for (let i = 0; i < 10; i++) {
      zones.push(squarePolygon(i * 5, 0, 1));
    }
    const result = unionExclusionZones(zones);
    expect(result).not.toBeNull();

    // Check a point in the LAST zone — if the union silently failed
    // after the first zone, this point would not be in the result.
    const pointInLast = turf.point([45.5, 0.5]);
    expect(turf.booleanWithin(pointInLast, result!)).toBe(true);
  });
});
