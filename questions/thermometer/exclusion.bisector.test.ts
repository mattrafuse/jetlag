import * as turf from "@turf/turf";
import { describe, expect, it, vi } from "vitest";

// Mock clipToGameBorder to be a no-op so the raw half-plane quad is returned
// unchanged. This lets us inspect the bisector edge directly without the game
// border clipping altering the geometry.
vi.mock("../exclusion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../exclusion")>();
  return {
    ...actual,
    clipToGameBorder: (polygon: GeoJSON.Feature<GeoJSON.Polygon>) => polygon,
  };
});

import { computeThermometerExclusion } from "./exclusion";

// Convert a [lat, lng] point to GeoJSON [lng, lat].
const toLngLat = (p: [number, number]): [number, number] => [p[1], p[0]];

// Angle (in degrees) between two 2D vectors. Perpendicular vectors yield 90°.
const angleBetweenDeg = (v1: [number, number], v2: [number, number]): number => {
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const mag1 = Math.hypot(v1[0], v1[1]);
  const mag2 = Math.hypot(v2[0], v2[1]);
  const cos = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
};

describe("computeThermometerExclusion: 360° bisector perpendicularity", () => {
  // Center point in the Toronto game area [lat, lng].
  const CENTER: [number, number] = [43.7, -79.4];
  // Segment length in degrees (small enough to stay in the game area).
  const d = 0.05;

  // Sweep a full 360°, building a segment from CENTER outward at each angle.
  for (let theta = 0; theta < 360; theta++) {
    it(`bisector is 90° off AB and half-plane is correct at ${theta}°`, () => {
      const rad = (theta * Math.PI) / 180;
      // Direction in the lng/lat plane (the code treats lng/lat as Cartesian).
      const dirLng = Math.cos(rad);
      const dirLat = Math.sin(rad);
      const start: [number, number] = [CENTER[0], CENTER[1]];
      const end: [number, number] = [CENTER[0] + d * dirLat, CENTER[1] + d * dirLng];

      const A = toLngLat(start);
      const B = toLngLat(end);
      const abDir: [number, number] = [B[0] - A[0], B[1] - A[1]];

      for (const answer of ["hotter", "colder"] as const) {
        const result = computeThermometerExclusion(start, end, answer);
        const ring = result.geometry.coordinates[0] as number[][];

        // The raw half-plane quad is [p1, p2, far2, far1, p1]; the first edge
        // (p1 -> p2) is the perpendicular bisector of AB.
        const p1 = ring[0];
        const p2 = ring[1];
        const bisectorDir: [number, number] = [p2[0] - p1[0], p2[1] - p1[1]];

        const angle = angleBetweenDeg(abDir, bisectorDir);
        // The bisector must be perpendicular to AB (90° ± a tiny epsilon).
        expect(angle).toBeCloseTo(90, 6);

        // Half-plane selection: hotter excludes START, colder excludes END.
        const excludedPoint = answer === "hotter" ? A : B;
        const keptPoint = answer === "hotter" ? B : A;
        const excludedIn = turf.booleanWithin(turf.point(excludedPoint), result);
        const keptIn = turf.booleanWithin(turf.point(keptPoint), result);
        expect(excludedIn).toBe(true);
        expect(keptIn).toBe(false);
      }
    });
  }
});
