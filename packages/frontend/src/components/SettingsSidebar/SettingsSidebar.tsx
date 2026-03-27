import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect } from "react";
import { SIDEBAR_WIDTH } from "../../constants";
import { useCanvasStore } from "../../stores/canvasStore";
import { ManageTags } from "../ManageTags";
import DataTab from "./DataTab";
import GeneralTab from "./GeneralTab";
import SharingTab from "./SharingTab";

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <IconButton
      data-tour="settings-button"
      onClick={onClick}
      title="Settings"
      size="small"
      sx={{
        color: "var(--color-subtext0)",
        "&:hover": { bgcolor: "var(--color-surface0)", color: "var(--color-text)" },
      }}
    >
      <SettingsIcon />
    </IconButton>
  );
}

export function SettingsSidebar() {
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const settingsTab = useCanvasStore((s) => s.settingsTab);
  const setSettingsTab = useCanvasStore((s) => s.setSettingsTab);

  const onClose = useCallback(() => setShowSettings(false), [setShowSettings]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          bgcolor: "var(--color-base)",
          borderRight: "1px solid var(--color-surface1)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2.5,
          pb: 0,
        }}
      >
        <Typography variant="h6">Settings</Typography>
        <IconButton onClick={onClose} sx={{ color: "var(--color-text)" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Tabs
        value={settingsTab}
        onChange={(_, val) => setSettingsTab(val)}
        sx={{ px: 2.5, borderBottom: "1px solid var(--color-surface0)" }}
      >
        <Tab label="General" value="general" />
        <Tab label="Tags" value="tags" />
        <Tab label="Data" value="data" />
        <Tab label="Sharing" value="sharing" />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
        {settingsTab === "general" && <GeneralTab />}
        {settingsTab === "tags" && <ManageTags />}
        {settingsTab === "data" && <DataTab />}
        {settingsTab === "sharing" && <SharingTab />}
      </Box>
    </Drawer>
  );
}
