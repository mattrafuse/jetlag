import { HelpOutlined as HelpIcon } from "@mui/icons-material";
import { darken, IconButton, lighten, useTheme } from "@mui/material";
import { store } from "../../questions";
import { useStore } from "./useStore";

// ── Toggle Button ──────────────────────────────────────────────
export const TogglePanelButton = () => {
  const theme = useTheme();
  const s = useStore();

  const bgcolor = s.panelOpen ? theme.palette.primary.main : theme.palette.background.paper;
  const hoverColor =
    theme.palette.mode === "light"
      ? s.panelOpen
        ? lighten(theme.palette.primary.main, 0.2)
        : darken(bgcolor, 0.2)
      : s.panelOpen
        ? darken(theme.palette.primary.main, 0.2)
        : lighten(bgcolor, 0.2);

  return (
    <IconButton
      onClick={() => store.update({ panelOpen: !s.panelOpen })}
      sx={(theme) => ({
        bgcolor,
        boxShadow: 2,
        transition: theme.transitions.create("background-color"),
        "&:hover": {
          bgcolor: hoverColor,
        },
      })}
      aria-label="Toggle questions panel"
    >
      <HelpIcon />
    </IconButton>
  );
};
