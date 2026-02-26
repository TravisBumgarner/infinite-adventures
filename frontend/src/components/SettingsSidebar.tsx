import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import LogoutIcon from "@mui/icons-material/Logout";
import SchoolIcon from "@mui/icons-material/School";
import SettingsIcon from "@mui/icons-material/Settings";
import UploadIcon from "@mui/icons-material/Upload";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { exportCanvas } from "../api/client";
import { logout } from "../auth/service";
import { SIDEBAR_WIDTH } from "../constants";
import { useImportCanvas } from "../hooks/mutations";
import FeedbackForm from "../sharedComponents/FeedbackForm";
import { useAppStore } from "../stores/appStore";
import { useCanvasStore } from "../stores/canvasStore";
import type { ThemePreference } from "../styles/styleConsts";
import { useThemePreference } from "../styles/Theme";
import { ManageTags } from "./ManageTags";

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

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const DISCORD_URL = "https://discord.com/invite/J8jwMxEEff";
export function SettingsSidebar() {
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const setShowOnboarding = useCanvasStore((s) => s.setShowOnboarding);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const canvases = useCanvasStore((s) => s.canvases);
  const showToast = useAppStore((s) => s.showToast);
  const { preference, setPreference } = useThemePreference();
  const [exporting, setExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportCanvas();

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

  const onClose = useCallback(() => setShowSettings(false), [setShowSettings]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleExport = async () => {
    if (!activeCanvasId) return;
    setExporting(true);
    try {
      const blob = await exportCanvas(activeCanvasId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeCanvas?.name ?? "canvas"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Canvas exported");
    } catch {
      showToast("Failed to export canvas");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importMutation.mutate(file, {
      onSuccess: () => {
        showToast("Canvas imported successfully");
      },
      onError: () => {
        showToast("Failed to import canvas");
      },
    });
    e.target.value = "";
  };

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
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Settings</Typography>
        <IconButton onClick={onClose} sx={{ color: "var(--color-text)" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Theme */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
          Theme
        </Typography>
        <ToggleButtonGroup
          value={preference}
          exclusive
          onChange={(_e, val) => {
            if (val !== null) setPreference(val as ThemePreference);
          }}
          size="small"
          fullWidth
        >
          {THEME_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Manage Tags */}
      <ManageTags />

      {/* Data */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
          Data
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exporting || !activeCanvasId}
        >
          {exporting ? "Backing up..." : "Backup Canvas"}
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => importInputRef.current?.click()}
          disabled={importMutation.isPending}
        >
          {importMutation.isPending ? "Importing..." : "Import Canvas"}
        </Button>
        <input ref={importInputRef} type="file" accept=".zip" hidden onChange={handleImport} />
      </Box>

      {/* Feedback */}
      <FeedbackForm />

      {/* Discord */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
          Community
        </Typography>
        <Button
          variant="outlined"
          component="a"
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Join us on Discord
        </Button>
      </Box>

      {/* Restart Tour */}
      <Button
        variant="outlined"
        startIcon={<SchoolIcon />}
        onClick={() => {
          setShowSettings(false);
          setShowOnboarding(true);
        }}
      >
        Restart Tour
      </Button>

      {/* Logout */}
      <Box sx={{ mt: "auto" }}>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={async () => {
            await logout();
            window.location.href = "/";
          }}
        >
          Log Out
        </Button>
      </Box>
    </Drawer>
  );
}
