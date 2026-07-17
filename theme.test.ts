import { describe, expect, it } from "vitest";
import { createAppTheme } from "./theme";

// ── createAppTheme ─────────────────────────────────────────────
// Critical path: the overlay theme must follow the map's dark mode
// so the React UI matches the basemap.
describe("createAppTheme", () => {
  it("uses light mode when darkMode is false", () => {
    const theme = createAppTheme(false);
    expect(theme.palette.mode).toBe("light");
  });

  it("uses dark mode when darkMode is true", () => {
    const theme = createAppTheme(true);
    expect(theme.palette.mode).toBe("dark");
  });

  it("applies the shared border radius", () => {
    const theme = createAppTheme(false);
    expect(theme.shape.borderRadius).toBe(8);
  });
});
