import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";
import { computeThermometerExclusion } from "./exclusion";

// Test coordinates around Toronto [lat, lng]
const START: [number, number] = [43.6532, -79.3832];
const END: [number, number] = [43.7, -79.42];

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

    // A point far to the "start side" should be in hotter but not colder
    // and vice versa. Use the start point itself.
    const startPoint = turf.point([START[1], START[0]]);
    const endPoint = turf.point([END[1], END[0]]);

    expect(turf.booleanWithin(startPoint, hotter)).toBe(true);
    expect(turf.booleanWithin(startPoint, colder)).toBe(false);
    expect(turf.booleanWithin(endPoint, colder)).toBe(true);
    expect(turf.booleanWithin(endPoint, hotter)).toBe(false);
  });
});
