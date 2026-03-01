import LogoutIcon from "@mui/icons-material/Logout";
import SchoolIcon from "@mui/icons-material/School";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { logout } from "../../auth/service";
import FeedbackForm from "../../sharedComponents/FeedbackForm";
import { useCanvasStore } from "../../stores/canvasStore";
import type { ThemePreference } from "../../styles/styleConsts";
import { useThemePreference } from "../../styles/Theme";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const DISCORD_URL = "https://discord.com/invite/J8jwMxEEff";

export default function GeneralTab() {
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
