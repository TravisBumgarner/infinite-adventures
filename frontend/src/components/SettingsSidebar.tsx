import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import LogoutIcon from "@mui/icons-material/Logout";
import SchoolIcon from "@mui/icons-material/School";
import SettingsIcon from "@mui/icons-material/Settings";
import UploadIcon from "@mui/icons-material/Upload";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Share } from "shared";
import { exportCanvas } from "../api/index";
import { logout } from "../auth/service";
import { CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../constants";
import { useDeleteShare, useImportCanvas } from "../hooks/mutations";
import { useShares } from "../hooks/queries";
import FeedbackForm from "../sharedComponents/FeedbackForm";
import { canvasItemTypeIcon, LabelBadge } from "../sharedComponents/LabelBadge";
import { useAppStore } from "../stores/appStore";
import { useCanvasStore } from "../stores/canvasStore";
import type { ThemePreference } from "../styles/styleConsts";
import { FONT_SIZES } from "../styles/styleConsts";
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

function GeneralTab() {
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const setShowOnboarding = useCanvasStore((s) => s.setShowOnboarding);
  const { preference, setPreference } = useThemePreference();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

      {/* Feedback */}
      <FeedbackForm />

      {/* Community */}
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
        <Button
          variant="outlined"
          component="a"
          href="/release-notes"
          target="_blank"
          rel="noopener noreferrer"
        >
          Release Notes
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
    </Box>
  );
}

function DataTab() {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const canvases = useCanvasStore((s) => s.canvases);
  const showToast = useAppStore((s) => s.showToast);
  const [exporting, setExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportCanvas();

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

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
    });
    e.target.value = "";
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
  );
}

function ShareRow({ share }: { share: Share }) {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const showToast = useAppStore((s) => s.showToast);
  const deleteMutation = useDeleteShare(activeCanvasId ?? "");

  const shareUrl = `${window.location.origin}/shared/${share.token}`;
  const label = share.itemId ? (share.itemTitle ?? "Item") : "Entire Canvas";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    showToast("Link copied to clipboard");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        bgcolor: "var(--color-surface0)",
        borderRadius: 1,
        px: 1.5,
        py: 1,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
        {share.itemId && share.itemType && (
          <LabelBadge
            label={
              CANVAS_ITEM_TYPES.find((t) => t.value === share.itemType)?.label ?? share.itemType
            }
            accentColor="var(--color-surface1)"
            icon={canvasItemTypeIcon(share.itemType)}
            height={18}
            fontSize={FONT_SIZES.xs}
          />
        )}
      </Box>
      <IconButton size="small" onClick={handleCopy} title="Copy link">
        <ContentCopyIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => deleteMutation.mutate(share.id)}
        disabled={deleteMutation.isPending}
        title="Revoke link"
        sx={{ color: "var(--color-red)" }}
      >
        <LinkOffIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

function SharingTab() {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const { data: shares, isLoading } = useShares(activeCanvasId);

  if (isLoading) {
    return (
      <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
        Loading...
      </Typography>
    );
  }

  if (!shares?.length) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", py: 2 }}>
        <LinkOffIcon sx={{ fontSize: 32, color: "var(--color-overlay0)" }} />
        <Typography variant="body2" sx={{ color: "var(--color-subtext0)", textAlign: "center" }}>
          No active share links. Use the share button in the top bar or item menu to create one.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
        Active Share Links
      </Typography>
      {shares.map((share) => (
        <ShareRow key={share.id} share={share} />
      ))}
    </Box>
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
