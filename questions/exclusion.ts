// ── Shared Exclusion Zone Utilities ────────────────────────────
// Per-type exclusion geometry lives in `radar/exclusion.ts` and
// `thermometer/exclusion.ts`. This module holds the shared
// `unionExclusionZones` and `clipToGameBorder` helpers used by both.

import * as turf from "@turf/turf";
import { gameBorder } from "./game-border";

export { computeRadarExclusion } from "./radar/exclusion";
export { computeThermometerExclusion } from "./thermometer/exclusion";

/**
 * Clip a polygon to the game border so it never extends beyond the
 * playable area. This keeps coordinates geographically valid and
 * ensures the rendered overlay matches the actual exclusion region.
 *
 * Returns the original polygon if clipping fails (defensive fallback).
 */
export const clipToGameBorder = (
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
): GeoJSON.Feature<GeoJSON.Polygon> => {
  try {
    const clipped = turf.intersect(turf.featureCollection([gameBorder, polygon]));
    if (clipped) {
      return clipped as GeoJSON.Feature<GeoJSON.Polygon>;
    }
  } catch {
    // fall through to return original
  }
  return polygon;
};

/**
 * Union multiple exclusion polygons into a single cumulative polygon.
 * Returns null if the array is empty.
 *
 * Note: turf v7's `turf.union` takes a FeatureCollection of polygons
 * (not two separate features, as in earlier versions).
 */
export const unionExclusionZones = (
  zones: GeoJSON.Feature<GeoJSON.Polygon>[],
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null => {
  if (zones.length === 0) return null;

  try {
    const fc = turf.featureCollection(zones);
    const unioned = turf.union(fc);
    if (!unioned) return null;
    return unioned as unknown as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  } catch {
    // If the union fails (e.g. invalid geometry), fall back to the first zone
    // so we don't lose all prior exclusions.
    return zones[0];
  }
};

