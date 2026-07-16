// ── Radar Exclusion Geometry ───────────────────────────────────
// Pure functions that compute exclusion polygons from radar answers.

import * as turf from "@turf/turf";
import { MILES_TO_KM, OUTER_BOUNDS } from "../../constants";

/**
 * Compute the exclusion polygon for a radar question.
 *
 * - "yes" (hider IS within range): Everything OUTSIDE the circle is excluded.
 *   Returns a large bounding polygon with a circular hole.
 * - "no" (hider NOT within range): Everything INSIDE the circle is excluded.
 *   Returns the circle itself as the exclusion zone.
 */
export const computeRadarExclusion = (
  center: [number, number], // [lat, lng]
  distanceMiles: number,
  answer: "yes" | "no",
): GeoJSON.Feature<GeoJSON.Polygon> => {
  const centerPoint = turf.point([center[1], center[0]]); // [lng, lat]
  const radiusKm = distanceMiles * MILES_TO_KM;
  const circle = turf.circle(centerPoint, radiusKm, { units: "kilometers", steps: 64 });

  if (answer === "no") {
    // Exclude the inside of the circle
    return circle;
  }

  // "yes" — exclude everything OUTSIDE the circle
  // Create a large bounding polygon with the circle as a hole
  const outerRing: number[][] = OUTER_BOUNDS.map(([lat, lng]) => [lng, lat]);
  const holeRing = circle.geometry.coordinates[0];

  return turf.polygon([outerRing, holeRing]);
};
