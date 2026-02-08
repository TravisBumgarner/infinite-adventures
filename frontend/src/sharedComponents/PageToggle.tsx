import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";

interface PageToggleProps {
  activePage: "canvas" | "sessions";
}

export default function PageToggle({ activePage }: PageToggleProps) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        p: 0.5,
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--color-surface1)",
        borderRadius: 2,
      }}
    >
      <Button
        size="small"
        onClick={() => navigate("/canvas")}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: 14,
          px: 2,
          py: 0.5,
          borderRadius: 1.5,
          color: activePage === "canvas" ? "var(--color-text)" : "var(--color-subtext0)",
          bgcolor: activePage === "canvas" ? "var(--color-surface0)" : "transparent",
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        Canvas
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/sessions")}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: 14,
          px: 2,
          py: 0.5,
          borderRadius: 1.5,
          color: activePage === "sessions" ? "var(--color-text)" : "var(--color-subtext0)",
          bgcolor: activePage === "sessions" ? "var(--color-surface0)" : "transparent",
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        Sessions
      </Button>
    </Box>
  );
}
