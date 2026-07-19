// ── Thermometer Exclusion Geometry ──────────────────────────────
// Pure functions that compute exclusion polygons from thermometer answers.

import * as turf from "@turf/turf";
import { clipToGameBorder } from "../exclusion";
import { gameBorder } from "../game-border";

/**
 * Degrees of latitude/longitude to extend the half-plane polygon beyond the
 * midpoint. The polygon is clipped to the game border afterwards, so this
 * just needs to be large enough that the half-plane fully covers the game
 * area on the excluded side.
 */
const EXTENT = 90;

/**
 * Compute the exclusion polygon for a thermometer question.
 *
 * The perpendicular bisector of the segment from start to end divides the plane.
 * - "hotter" (end is closer to hider): Exclude the half-plane containing the START point.
 * - "colder" (end is farther from hider): Exclude the half-plane containing the END point.
 *
 * The resulting polygon is clipped to the game border so it never extends
 * beyond the playable area.
 */
export const computeThermometerExclusion = (
  start: [number, number], // [lat, lng]
  end: [number, number], // [lat, lng]
  answer: "hotter" | "colder",
): GeoJSON.Feature<GeoJSON.Polygon> => {
  // Reuse the bisector geometry; its endpoints span the game region and form
  // the base edge of the half-plane quad we build below.
  const bisector = computeThermometerBisector(start, end);
  if (!bisector) {
    // Start and end are the same — return degenerate polygon
    return turf.polygon([
      [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    ]);
  }

  // Convert to [lng, lat] for turf
  const A: [number, number] = [start[1], start[0]];
  const B: [number, number] = [end[1], end[0]];

  // Direction vector of AB
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];

  const len = Math.sqrt(dx * dx + dy * dy);

  // Midpoint of AB — the bisector passes through here, perpendicular to AB.
  const midLng = (A[0] + B[0]) / 2;
  const midLat = (A[1] + B[1]) / 2;

  // Base edge of the half-plane quad: the bisector endpoints (clipped to the
  // game region). Extending these by EXTENT along AB below covers the excluded
  // half-plane; the final clipToGameBorder keeps it within the playable area.
  const bisectorCoords =
    bisector.geometry.type === "LineString"
      ? bisector.geometry.coordinates
      : bisector.geometry.coordinates[0];
  const p1: [number, number] = [bisectorCoords[0][0], bisectorCoords[0][1]];
  const p2: [number, number] = [
    bisectorCoords[bisectorCoords.length - 1][0],
    bisectorCoords[bisectorCoords.length - 1][1],
  ];

  // Determine which side of the bisector to exclude.
  // Projecting a point onto the AB direction (measured from the midpoint)
  // tells us which half-plane it lies in: negative = A side, positive = B side.
  const sideOfBisector = (px: number, py: number): number =>
    dx * (px - midLng) + dy * (py - midLat);

  // For "hotter": exclude the side containing START (A).
  // For "colder": exclude the side containing END (B).
  const pointToExclude = answer === "hotter" ? A : B;
  const sign = sideOfBisector(pointToExclude[0], pointToExclude[1]) >= 0 ? 1 : -1;

  // Direction toward the excluded side is perpendicular to the bisector
  // (i.e. along AB). `sign` flips it toward A or B as needed.
  const sideDx = (dx / len) * sign;
  const sideDy = (dy / len) * sign;

  // Build a large quad covering the excluded half-plane, then clip to the
  // game border so the polygon stays within the playable area.
  const far1: [number, number] = [p1[0] + sideDx * EXTENT, p1[1] + sideDy * EXTENT];
  const far2: [number, number] = [p2[0] + sideDx * EXTENT, p2[1] + sideDy * EXTENT];

  const halfPlane = turf.polygon([[p1, p2, far2, far1, p1]]);
  return clipToGameBorder(halfPlane);
};

/**
 * Compute the perpendicular bisector line of the segment from start to end,
 * clipped to the game border so it spans the playable region. This is the
 * line along which the thermometer exclusion will land, useful for
 * visualizing where the hider must lie relative to the two points.
 *
 * Returns a LineString feature (in [lng, lat] GeoJSON order) of the bisector
 * segment(s) within the game area, or null if the bisector does not intersect
 * the game border.
 */
export const computeThermometerBisector = (
  start: [number, number], // [lat, lng]
  end: [number, number], // [lat, lng]
): GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> | null => {
  // Convert to [lng, lat] for turf
  const A: [number, number] = [start[1], start[0]];
  const B: [number, number] = [end[1], end[0]];

  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) {
    return null;
  }

  // Midpoint of AB — the bisector passes through here, perpendicular to AB.
  const midLng = (A[0] + B[0]) / 2;
  const midLat = (A[1] + B[1]) / 2;

  // Perpendicular direction (rotate AB 90° CCW), normalized.
  const perpDx = -dy / len;
  const perpDy = dx / len;

  // Two points on the bisector, extended far enough to cover the map.
  const p1: [number, number] = [midLng + perpDx * EXTENT, midLat + perpDy * EXTENT];
  const p2: [number, number] = [midLng - perpDx * EXTENT, midLat - perpDy * EXTENT];

  const bisector = turf.lineString([p1, p2]);
  try {
    // The bisector passes through the midpoint, which lies inside the game
    // area (both endpoints are placed within the border). Clip it to the
    // game region by finding where it crosses the border boundary and keeping
    // the segment between those two crossings.
    const crossings = turf.lineIntersect(bisector, gameBorder);
    const coords = crossings.features.map((f) => f.geometry.coordinates);
    if (coords.length >= 2) {
      const clipped = turf.lineString([coords[0], coords[coords.length - 1]]);
      return clipped;
    }
  } catch {
    // fall through to return the raw bisector
  }
  return bisector;
};
