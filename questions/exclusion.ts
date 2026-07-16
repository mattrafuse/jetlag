// ── Shared Exclusion Zone Utilities ────────────────────────────
// Per-type exclusion geometry lives in `radar/exclusion.ts` and
// `thermometer/exclusion.ts`. This module holds only the shared
// `unionExclusionZones` helper used by the orchestrator.

import * as turf from "@turf/turf";

export { computeRadarExclusion } from "./radar/exclusion";
export { computeThermometerExclusion } from "./thermometer/exclusion";

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
