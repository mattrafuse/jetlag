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

  it("for 'yes': a point outside the circle but inside the game border is excluded", () => {
    const polygon = computeRadarExclusion(CENTER, DISTANCE, "yes");
    // A point ~6 miles north of center — outside the 5-mile circle but
    // still within the Toronto game border.
    const outsidePoint = turf.point([-79.38, 43.74]);
    expect(turf.booleanWithin(outsidePoint, polygon)).toBe(true);
  });

  it("for 'yes': the center point is NOT inside the exclusion zone (it's in the hole)", () => {
    const polygon = computeRadarExclusion(CENTER, DISTANCE, "yes");
    const centerPoint = turf.point([CENTER[1], CENTER[0]]);
    expect(turf.booleanWithin(centerPoint, polygon)).toBe(false);
  });

  it("produces a larger circle for a larger distance ('no')", () => {
    const small = computeRadarExclusion(CENTER, 1, "no");
    const large = computeRadarExclusion(CENTER, 10, "no");

    // A point ~3 miles away should be outside the small circle but inside the large one.
    // 3 miles ≈ 0.043 degrees latitude
    const testPoint = turf.point([CENTER[1], CENTER[0] + 0.043]);
    expect(turf.booleanWithin(testPoint, small)).toBe(false);
    expect(turf.booleanWithin(testPoint, large)).toBe(true);
  });
});

// ── Coordinate validity ─────────────────────────────────────────
describe("computeRadarExclusion: coordinate validity", () => {
  // Helper: check all coordinates in a polygon are valid GeoJSON
  const expectValidGeoJSONCoords = (feature: GeoJSON.Feature<GeoJSON.Polygon>): void => {
    const checkRing = (ring: number[][]): void => {
      for (const [lng, lat] of ring) {
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    };
    for (const ring of feature.geometry.coordinates) {
      checkRing(ring as number[][]);
    }
  };

  it("'no' polygon coordinates are within valid GeoJSON range", () => {
    const polygon = computeRadarExclusion(CENTER, DISTANCE, "no");
    expectValidGeoJSONCoords(polygon);
  });

  it("'yes' polygon coordinates are within valid GeoJSON range", () => {
    const polygon = computeRadarExclusion(CENTER, DISTANCE, "yes");
    expectValidGeoJSONCoords(polygon);
  });

  it("'no' polygon with large distance has valid coordinates", () => {
    const polygon = computeRadarExclusion(CENTER, 50, "no");
    expectValidGeoJSONCoords(polygon);
  });

  it("'yes' polygon with large distance has valid coordinates", () => {
    const polygon = computeRadarExclusion(CENTER, 50, "yes");
    expectValidGeoJSONCoords(polygon);
  });
});
