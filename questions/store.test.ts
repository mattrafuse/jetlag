import { beforeEach, describe, expect, it } from "vitest";
import { callbacks, store } from "./store";

describe("store", () => {
  beforeEach(() => {
    // Reset to initial state before each test
    store.update({
      panelOpen: false,
      activeTab: "radar",
      radarCenter: null,
      radarDistance: 5,
      radarCustomDistance: 0,
      radarUseCustom: false,
      thermoStart: null,
      thermoEnd: null,
      thermoDistance: 0.5,
      history: [],
      stations: [],
      showRemoved: false,
    });
  });

  it("returns the current state via get()", () => {
    const state = store.get();
    expect(state.panelOpen).toBe(false);
    expect(state.activeTab).toBe("radar");
  });

  it("merges partial updates into state", () => {
    store.update({ panelOpen: true, radarDistance: 10 });
    const state = store.get();
    expect(state.panelOpen).toBe(true);
    expect(state.radarDistance).toBe(10);
    // Unchanged fields are preserved
    expect(state.activeTab).toBe("radar");
  });

  it("notifies subscribers on update", () => {
    let callCount = 0;
    const unsubscribe = store.subscribe(() => {
      callCount++;
    });

    store.update({ panelOpen: true });
    expect(callCount).toBe(1);

    store.update({ radarDistance: 3 });
    expect(callCount).toBe(2);

    unsubscribe();

    store.update({ panelOpen: false });
    expect(callCount).toBe(2); // no new calls after unsubscribe
  });

  it("supports multiple subscribers", () => {
    let countA = 0;
    let countB = 0;
    const unsubA = store.subscribe(() => countA++);
    const unsubB = store.subscribe(() => countB++);

    store.update({ panelOpen: true });
    expect(countA).toBe(1);
    expect(countB).toBe(1);

    unsubA();
    store.update({ panelOpen: false });
    expect(countA).toBe(1);
    expect(countB).toBe(2);

    unsubB();
  });
});

describe("callbacks", () => {
  it("all callbacks are no-ops by default", () => {
    // These should not throw
    expect(() => callbacks.submitRadar("yes")).not.toThrow();
    expect(() => callbacks.submitThermo("hotter")).not.toThrow();
    expect(() => callbacks.switchTab("radar")).not.toThrow();
    expect(() => callbacks.clearRadarMarker()).not.toThrow();
    expect(() => callbacks.clearThermoMarkers()).not.toThrow();
    expect(() => callbacks.startRadarPicking()).not.toThrow();
    expect(() => callbacks.startThermoPicking()).not.toThrow();
    expect(() => callbacks.setShowRemoved(true)).not.toThrow();
  });

  it("callbacks can be overridden", () => {
    let captured: string | null = null;
    callbacks.submitRadar = (answer) => {
      captured = answer;
    };
    callbacks.submitRadar("no");
    expect(captured).toBe("no");

    // Reset
    callbacks.submitRadar = () => {};
  });
});
