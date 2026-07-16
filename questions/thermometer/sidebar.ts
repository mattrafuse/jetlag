// ── Thermometer Sidebar Controller ───────────────────────────────
// Encapsulates all thermometer-specific map interaction: start/end
// marker placement, connecting line, and submission. The orchestrator
// creates and composes this controller; it never imports radar code.

import L from "leaflet";
import { thermometerQuestions } from "./data";
import type { AskedThermometerQuestion } from "./types";

export interface ThermometerControllerDependencies {
  map: L.Map;
  store: {
    get: () => { thermoDistance: number };
    update: (
      partial: Partial<{
        thermoStart: [number, number] | null;
        thermoEnd: [number, number] | null;
      }>,
    ) => void;
  };
  nextId: () => string;
  onQuestionAsked: (question: AskedThermometerQuestion) => void;
}

export interface ThermometerController {
  startPicking: () => void;
  clearMarkers: () => void;
  submit: (answer: "hotter" | "colder") => void;
  destroy: () => void;
}

/** Create a thermometer controller bound to the given map and dependencies. */
export const createThermometerController = (
  deps: ThermometerControllerDependencies,
): ThermometerController => {
  const { map, store, nextId, onQuestionAsked } = deps;

  let start: [number, number] | null = null;
  let end: [number, number] | null = null;
  let startMarker: L.Marker | null = null;
  let endMarker: L.Marker | null = null;
  let line: L.Polyline | null = null;
  let clickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

  // ── Marker cleanup ──────────────────────────────────────────
  const clearMarkers = (): void => {
    if (startMarker) {
      map.removeLayer(startMarker);
      startMarker = null;
    }
    if (endMarker) {
      map.removeLayer(endMarker);
      endMarker = null;
    }
    if (line) {
      map.removeLayer(line);
      line = null;
    }
    start = null;
    end = null;
    if (clickHandler) {
      map.off("click", clickHandler);
      clickHandler = null;
    }
    store.update({ thermoStart: null, thermoEnd: null });
  };

  // ── Picking ─────────────────────────────────────────────────
  const startPicking = (): void => {
    clearMarkers();
    clickHandler = (e: L.LeafletMouseEvent) => {
      if (!start) {
        start = [e.latlng.lat, e.latlng.lng];
        startMarker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: "questions-thermo-marker",
            html: '<div class="questions-thermo-marker-dot start">S</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
        store.update({ thermoStart: start });
      } else if (!end) {
        end = [e.latlng.lat, e.latlng.lng];
        endMarker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: "questions-thermo-marker",
            html: '<div class="questions-thermo-marker-dot end">E</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
        if (startMarker) {
          line = L.polyline([startMarker.getLatLng(), e.latlng], {
            color: "#3388ff",
            weight: 2,
            dashArray: "5, 5",
          }).addTo(map);
        }
        store.update({ thermoEnd: end });
        // Stop listening after both points are placed.
        const h = clickHandler;
        if (h) {
          map.off("click", h);
          clickHandler = null;
        }
      }
    };
    map.on("click", clickHandler);
  };

  // ── Submission ──────────────────────────────────────────────
  const submit = (answer: "hotter" | "colder"): void => {
    if (!start || !end) return;
    const s = store.get();
    const selected = thermometerQuestions.find((q) => q.distance === s.thermoDistance);
    if (!selected) return;

    const question: AskedThermometerQuestion = {
      id: nextId(),
      type: "thermometer",
      distance: selected.distance,
      label: selected.label,
      start,
      end,
      answer,
      timestamp: Date.now(),
    };

    onQuestionAsked(question);
    clearMarkers();
  };

  return {
    startPicking,
    clearMarkers,
    submit,
    destroy: clearMarkers,
  };
};

// Re-export for convenience.
export { thermometerQuestions } from "./data";
export { computeThermometerExclusion } from "./exclusion";
