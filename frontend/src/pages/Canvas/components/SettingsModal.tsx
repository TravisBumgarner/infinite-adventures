import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { logout } from "../../../auth/service";
import { SIDEBAR_WIDTH } from "../../../constants";
import { useAppStore } from "../../../stores/appStore";
import { useCanvasStore } from "../../../stores/canvasStore";
import type { ThemePreference } from "../../../styles/styleConsts";
import { useThemePreference } from "../../../styles/Theme";

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      title="Settings"
      sx={{
        bgcolor: "var(--color-base)",
        border: "1px solid var(--color-surface1)",
        color: "var(--color-text)",
        "&:hover": { bgcolor: "var(--color-surface0)" },
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
const CONTACT_FORM_URL = "https://contact-form.nfshost.com/contact";
const MAX_CHARS = 800;

export function SettingsSidebar() {
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const showToast = useAppStore((s) => s.showToast);
  const { preference, setPreference } = useThemePreference();
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onClose = useCallback(() => setShowSettings(false), [setShowSettings]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.target.value.length > MAX_CHARS) return;
      setFeedbackMessage(e.target.value);
    },
    [],
  );

  const handleSubmitFeedback = async () => {
    const trimmed = feedbackMessage.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const response = await fetch(CONTACT_FORM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, website: "infinite-adventures-feedback" }),
      });
      if (response.ok) {
        setFeedbackMessage("");
        showToast("Feedback sent — thank you!");
      } else {
        showToast("Failed to send feedback");
      }
    } catch {
      showToast("Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open
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

      {/* Feedback */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
          Feedback
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--color-overlay0)", textAlign: "right" }}>
          {feedbackMessage.length}/{MAX_CHARS} characters
        </Typography>
        <TextField
          multiline
          rows={4}
          placeholder="Tell us what you think..."
          value={feedbackMessage}
          onChange={handleMessageChange}
          size="small"
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleSubmitFeedback}
          disabled={submitting || !feedbackMessage.trim()}
        >
          {submitting ? "Sending..." : "Send Feedback"}
        </Button>
      </Box>

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
