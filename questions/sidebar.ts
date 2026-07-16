// ── Question Orchestrator ───────────────────────────────────────
// Composes the radar and thermometer controllers, manages the shared
// exclusion-zone list, station filtering, history persistence, and
// wires the callback registry used by the React UI.
//
// This is the ONLY module outside the `radar/` and `thermometer/`
// subfolders that knows about both question types. External modules
// import `initQuestions` and `stationRegistry` from the barrel
// (`index.ts`); they are opaque to the per-type internals.

import L from "leaflet";
import { unionExclusionZones } from "./exclusion";
import { loadHistory, loadSettings, nextId, saveHistory, saveSettings } from "./history";
import { computeRadarExclusion } from "./radar/exclusion";
import { createRadarController } from "./radar/sidebar";
import type { AskedRadarQuestion } from "./radar/types";
import { stationRegistry } from "./station-registry";
import { callbacks, store } from "./store";
import { computeThermometerExclusion } from "./thermometer/exclusion";
import { createThermometerController } from "./thermometer/sidebar";
import type { AskedThermometerQuestion } from "./thermometer/types";
import type { AskedQuestion, ExclusionZone } from "./types";

// ── Config ─────────────────────────────────────────────────────
interface QuestionsConfig {
  map: L.Map;
}

// ── Module state ───────────────────────────────────────────────
let map: L.Map;
let exclusionZones: ExclusionZone[] = [];
let exclusionLayer: L.GeoJSON | null = null;
let showRemovedStations = false;

// Controllers are created in `initQuestions` and live for the
// lifetime of the page.
let radarController: ReturnType<typeof createRadarController> | null = null;
let thermoController: ReturnType<typeof createThermometerController> | null = null;

// ── Exclusion layer ─────────────────────────────────────────────
const updateExclusionLayer = (): void => {
  if (exclusionLayer) {
    map.removeLayer(exclusionLayer);
    exclusionLayer = null;
  }
  const cumulative = unionExclusionZones(exclusionZones.map((z) => z.polygon));
  if (cumulative) {
    exclusionLayer = L.geoJSON(cumulative, {
      style: { color: "#ff4444", weight: 2, fillColor: "#ff4444", fillOpacity: 0.15 },
    }).addTo(map);
  }
};

// ── Station filtering ───────────────────────────────────────────
const refreshStationStatuses = (): void => {
  store.update({ stations: stationRegistry.getStationStatuses() });
};

const applyStationFilter = (): void => {
  const cumulative = unionExclusionZones(exclusionZones.map((z) => z.polygon));
  stationRegistry.resetAll();
  if (cumulative) {
    for (const id of stationRegistry.getStationIdsInExclusionZone(
      cumulative as GeoJSON.Feature<GeoJSON.Polygon>,
    )) {
      if (showRemovedStations) {
        stationRegistry.grayOutStation(id);
      } else {
        stationRegistry.removeStation(id);
      }
    }
  }
  refreshStationStatuses();
};

// ── Question processing ─────────────────────────────────────────
const computeExclusionPolygon = (question: AskedQuestion): GeoJSON.Feature<GeoJSON.Polygon> => {
  if (question.type === "radar") {
    return computeRadarExclusion(question.center, question.distance, question.answer);
  }
  return computeThermometerExclusion(question.start, question.end, question.answer);
};

const processQuestion = (question: AskedQuestion): void => {
  const polygon = computeExclusionPolygon(question);
  exclusionZones.push({ polygon, sourceQuestion: question });
  updateExclusionLayer();
  applyStationFilter();
};

const removeQuestion = (id: string): void => {
  exclusionZones = exclusionZones.filter((z) => z.sourceQuestion.id !== id);
  saveHistory(loadHistory().filter((q) => q.id !== id));
  updateExclusionLayer();
  applyStationFilter();
  renderHistory();
  refreshStationStatuses();
};

// ── History rendering ───────────────────────────────────────────
const renderHistory = (): void => {
  store.update({ history: loadHistory() });
};

// ── Tab switching ───────────────────────────────────────────────
const switchTab = (tab: "radar" | "thermometer"): void => {
  store.update({ activeTab: tab });
  if (tab === "radar") {
    thermoController?.clearMarkers();
    radarController?.startPicking();
  } else {
    radarController?.clearMarker();
    thermoController?.startPicking();
  }
};

// ── Question-asked callbacks (passed to controllers) ────────────
const onRadarQuestionAsked = (question: AskedRadarQuestion): void => {
  saveHistory([...loadHistory(), question]);
  processQuestion(question);
  renderHistory();
};

const onThermoQuestionAsked = (question: AskedThermometerQuestion): void => {
  saveHistory([...loadHistory(), question]);
  processQuestion(question);
  renderHistory();
};

// ── Init ────────────────────────────────────────────────────────
export const initQuestions = (config: QuestionsConfig): void => {
  map = config.map;

  // Create per-type controllers, injecting shared dependencies.
  radarController = createRadarController({
    map,
    store,
    nextId,
    onQuestionAsked: onRadarQuestionAsked,
  });

  thermoController = createThermometerController({
    map,
    store,
    nextId,
    onQuestionAsked: onThermoQuestionAsked,
  });

  // Wire the callback registry used by the React UI.
  callbacks.submitRadar = (answer) => radarController?.submit(answer);
  callbacks.submitThermo = (answer) => thermoController?.submit(answer);
  callbacks.switchTab = switchTab;
  callbacks.startRadarPicking = () => radarController?.startPicking();
  callbacks.startThermoPicking = () => thermoController?.startPicking();
  callbacks.clearRadarMarker = () => radarController?.clearMarker();
  callbacks.clearThermoMarkers = () => thermoController?.clearMarkers();
  callbacks.setShowRemoved = (v: boolean) => {
    showRemovedStations = v;
    store.update({ showRemoved: v });
    saveSettings({ showRemoved: v });
    applyStationFilter();
    refreshStationStatuses();
  };

  // Listen for question-removal events dispatched by the React UI.
  window.addEventListener(
    "jetlag-remove-question",
    ((e: CustomEvent<string>) => removeQuestion(e.detail)) as EventListener,
  );

  // Rebuild exclusion zones from persisted history.
  for (const q of loadHistory()) {
    exclusionZones.push({ polygon: computeExclusionPolygon(q), sourceQuestion: q });
  }

  showRemovedStations = loadSettings().showRemoved;
  store.update({ showRemoved: showRemovedStations });

  updateExclusionLayer();
  applyStationFilter();
  renderHistory();
  radarController.startPicking();
};
