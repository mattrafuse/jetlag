// ── Shared React overlay root ──────────────────────────────────
// Single React root that renders both the Settings panel and the
// Questions sidebar panel, so they coexist in one React tree.

import { Stack } from "@mui/material";
import { createRoot } from "react-dom/client";
import { SidebarPanel, TogglePanelButton } from "./questions/SidebarPanel";
import { LocateButton, SettingsPanel, ToggleSettingsButton } from "./SettingsPanel";

let root: ReturnType<typeof createRoot> | null = null;

export const initOverlay = (): void => {
  const container = document.getElementById("app-overlay")!;

  root = createRoot(container);

  root.render(
    <Stack spacing={1} direction="row" sx={{ height: "100%" }}>
      <Stack spacing={1} sx={{ p: 1 }}>
        <TogglePanelButton />

        <ToggleSettingsButton />

        <LocateButton />
      </Stack>

      <SettingsPanel />
      <SidebarPanel />
    </Stack>,
  );
};
