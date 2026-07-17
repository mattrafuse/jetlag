// ── Map view persistence ──────────────────────────────────────
// Saves the user's current map view (center + zoom) to localStorage and
// restores it on load, so the map opens where the user last left off.

import type L from "leaflet";

const DEFAULT_CENTER: L.LatLngExpression = [43.6532, -79.3832];
const DEFAULT_ZOOM = 12;
const VIEW_STORAGE_KEY = "jetlag-map-view";

interface SavedView {
  center: L.LatLngExpression;
  zoom: number;
}

// Restore the last-viewed map position from localStorage. Falls back to the
// default view if nothing is stored or the data is corrupt.
export const loadView = (): SavedView => {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.center) && typeof parsed.zoom === "number") {
        return { center: parsed.center as L.LatLngExpression, zoom: parsed.zoom };
      }
    }
  } catch {
    // Ignore corrupt data
  }
  return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
};

// Persist the current view whenever the user pans or zooms.
export const saveView = (map: L.Map): void => {
  const center = map.getCenter();
  localStorage.setItem(
    VIEW_STORAGE_KEY,
    JSON.stringify({ center: [center.lat, center.lng], zoom: map.getZoom() }),
  );
};

// Wire up view persistence: restore the saved view and keep it in sync with
// the map's move/zoom events.
export const initMapView = (map: L.Map): void => {
  const saved = loadView();
  map.setView(saved.center, saved.zoom);
  map.on("moveend", () => saveView(map));
};
