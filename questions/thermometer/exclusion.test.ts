import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";
import { computeThermometerExclusion } from "./exclusion";

// Test coordinates around Toronto [lat, lng]
const START: [number, number] = [43.6532, -79.3832];
const END: [number, number] = [43.7, -79.42];

// ── Helper: check all coordinates in a polygon are valid GeoJSON ──
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

// ── Helper: verify half-plane containment for a given answer ──
const expectHalfPlaneCorrect = (
  start: [number, number],
  end: [number, number],
  answer: "hotter" | "colder",
): void => {
  const polygon = computeThermometerExclusion(start, end, answer);
  const startPoint = turf.point([start[1], start[0]]);
  const endPoint = turf.point([end[1], end[0]]);
  const startIn = turf.booleanWithin(startPoint, polygon);
  const endIn = turf.booleanWithin(endPoint, polygon);

  if (answer === "hotter") {
    expect(startIn).toBe(true);
    expect(endIn).toBe(false);
  } else {
    expect(startIn).toBe(false);
    expect(endIn).toBe(true);
  }
};

describe("computeThermometerExclusion", () => {
  it("returns a Polygon feature for 'hotter'", () => {
    const result = computeThermometerExclusion(START, END, "hotter");
    expect(result.geometry.type).toBe("Polygon");
  });

  it("returns a Polygon feature for 'colder'", () => {
    const result = computeThermometerExclusion(START, END, "colder");
    expect(result.geometry.type).toBe("Polygon");
  });

  it("returns a degenerate polygon when start === end", () => {
    const result = computeThermometerExclusion(START, START, "hotter");
    expect(result.geometry.type).toBe("Polygon");
    // All coordinates should be [0, 0]
    const ring = result.geometry.coordinates[0] as number[][];
    for (const coord of ring) {
      expect(coord).toEqual([0, 0]);
    }
  });

  it("for 'hotter': the start point is inside the exclusion zone", () => {
    const polygon = computeThermometerExclusion(START, END, "hotter");
    const startPoint = turf.point([START[1], START[0]]);
    expect(turf.booleanWithin(startPoint, polygon)).toBe(true);
  });

  it("for 'hotter': the end point is NOT inside the exclusion zone", () => {
    const polygon = computeThermometerExclusion(START, END, "hotter");
    const endPoint = turf.point([END[1], END[0]]);
    expect(turf.booleanWithin(endPoint, polygon)).toBe(false);
  });

  it("for 'colder': the end point is inside the exclusion zone", () => {
    const polygon = computeThermometerExclusion(START, END, "colder");
    const endPoint = turf.point([END[1], END[0]]);
    expect(turf.booleanWithin(endPoint, polygon)).toBe(true);
  });

  it("for 'colder': the start point is NOT inside the exclusion zone", () => {
    const polygon = computeThermometerExclusion(START, END, "colder");
    const startPoint = turf.point([START[1], START[0]]);
    expect(turf.booleanWithin(startPoint, polygon)).toBe(false);
  });

  it("produces opposite half-planes for 'hotter' vs 'colder'", () => {
    const hotter = computeThermometerExclusion(START, END, "hotter");
    const colder = computeThermometerExclusion(START, END, "colder");

    const startPoint = turf.point([START[1], START[0]]);
    const endPoint = turf.point([END[1], END[0]]);

    expect(turf.booleanWithin(startPoint, hotter)).toBe(true);
    expect(turf.booleanWithin(startPoint, colder)).toBe(false);
    expect(turf.booleanWithin(endPoint, colder)).toBe(true);
    expect(turf.booleanWithin(endPoint, hotter)).toBe(false);
  });
});

// ── Coordinate validity (the rendering bug) ─────────────────────
describe("computeThermometerExclusion: coordinate validity", () => {
  it("all coordinates are within valid GeoJSON range for 'hotter'", () => {
    const polygon = computeThermometerExclusion(START, END, "hotter");
    expectValidGeoJSONCoords(polygon);
  });

  it("all coordinates are within valid GeoJSON range for 'colder'", () => {
    const polygon = computeThermometerExclusion(START, END, "colder");
    expectValidGeoJSONCoords(polygon);
  });

  it("coordinates are valid for a long diagonal segment", () => {
    // A segment spanning a larger portion of the Toronto area
    const polygon = computeThermometerExclusion([43.65, -79.45], [43.74, -79.3], "hotter");
    expectValidGeoJSONCoords(polygon);
  });

  it("coordinates are valid for a segment near the game border edge", () => {
    const polygon = computeThermometerExclusion([43.6532, -79.3832], [43.73, -79.4], "colder");
    expectValidGeoJSONCoords(polygon);
  });

  it("coordinates are valid for a vertical (north-south) segment", () => {
    const polygon = computeThermometerExclusion([43.66, -79.38], [43.72, -79.38], "colder");
    expectValidGeoJSONCoords(polygon);
  });

  it("coordinates are valid for a horizontal (east-west) segment", () => {
    const polygon = computeThermometerExclusion([43.7, -79.3], [43.7, -79.45], "hotter");
    expectValidGeoJSONCoords(polygon);
  });
});

// ── Geographic edge cases (within the Toronto game area) ────────
describe("computeThermometerExclusion: geographic edge cases", () => {
  it("diagonal SW-NE segment: hotter excludes start side", () => {
    expectHalfPlaneCorrect([43.65, -79.45], [43.74, -79.3], "hotter");
  });

  it("diagonal SW-NE segment: colder excludes end side", () => {
    expectHalfPlaneCorrect([43.65, -79.45], [43.74, -79.3], "colder");
  });

  it("diagonal NW-SE segment: hotter excludes start side", () => {
    expectHalfPlaneCorrect([43.74, -79.45], [43.67, -79.3], "hotter");
  });

  it("diagonal NW-SE segment: colder excludes end side", () => {
    expectHalfPlaneCorrect([43.74, -79.45], [43.67, -79.3], "colder");
  });

  it("vertical segment (north-south): hotter excludes start side", () => {
    expectHalfPlaneCorrect([43.66, -79.38], [43.72, -79.38], "hotter");
  });

  it("vertical segment (north-south): colder excludes end side", () => {
    expectHalfPlaneCorrect([43.66, -79.38], [43.72, -79.38], "colder");
  });

  it("horizontal segment (east-west): hotter excludes start side", () => {
    expectHalfPlaneCorrect([43.7, -79.3], [43.7, -79.45], "hotter");
  });

  it("horizontal segment (east-west): colder excludes end side", () => {
    expectHalfPlaneCorrect([43.7, -79.3], [43.7, -79.45], "colder");
  });

  it("short segment: hotter excludes start side", () => {
    expectHalfPlaneCorrect([43.6532, -79.3832], [43.66, -79.39], "hotter");
  });

  it("short segment: colder excludes end side", () => {
    expectHalfPlaneCorrect([43.6532, -79.3832], [43.66, -79.39], "colder");
  });

  // Known limitation: segments crossing the antimeridian (±180° longitude)
  // are not handled correctly because the half-plane polygon would need to
  // wrap around the globe. This is acceptable for a city-scale game.
  it.skip("near the antimeridian: hotter excludes start side", () => {
    expectHalfPlaneCorrect([0, 179], [0, -179], "hotter");
  });

  it.skip("near the antimeridian: colder excludes end side", () => {
    expectHalfPlaneCorrect([0, 179], [0, -179], "colder");
  });
});
