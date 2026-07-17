export const QUARTER_MILE = 402.336;

/**
 * Fraction of a station's quarter-mile radius used when testing whether the
 * station falls inside an exclusion zone. We shrink the test circle slightly
 * so that stations near the game border (whose full radius circle spills
 * outside the border-clipped exclusion polygon) are still correctly excluded.
 */
export const EXCLUSION_RADIUS_FRACTION = 0.99;

export const MILES_TO_KM = 1.60934;

/** Large bounding box covering the entire region (reused from border.ts pattern). */
export const OUTER_BOUNDS: [number, number][] = [
  [-90, -180],
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180],
];
