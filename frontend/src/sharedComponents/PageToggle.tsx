import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MapIcon from "@mui/icons-material/Map";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import TimelineIcon from "@mui/icons-material/Timeline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";

interface PageToggleProps {
  activePage: "canvas" | "sessions" | "timeline" | "gallery" | "tree";
}

export default function PageToggle({ activePage }: PageToggleProps) {
  const navigate = useNavigate();

  return (
    <Box
      data-tour="page-toggle"
      sx={{
        display: "flex",
        gap: 0.25,
      }}
    >
      <Button
        size="small"
        onClick={() => navigate("/canvas")}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: 13,
          px: 1.5,
          py: 0.25,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minWidth: "auto",
          color: activePage === "canvas" ? "var(--color-text)" : "var(--color-subtext0)",
          bgcolor: activePage === "canvas" ? "var(--color-surface0)" : "transparent",
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        <MapIcon sx={{ fontSize: 16 }} />
        Canvas
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/sessions")}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: 13,
          px: 1.5,
          py: 0.25,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minWidth: "auto",
          color: activePage === "sessions" ? "var(--color-text)" : "var(--color-subtext0)",
          bgcolor: activePage === "sessions" ? "var(--color-surface0)" : "transparent",
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        <CalendarMonthIcon sx={{ fontSize: 16 }} />
        Sessions
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/timeline")}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: 13,
          px: 1.5,
          py: 0.25,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minWidth: "auto",
          color: activePage === "timeline" ? "var(--color-text)" : "var(--color-subtext0)",
          bgcolor: activePage === "timeline" ? "var(--color-surface0)" : "transparent",
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        <TimelineIcon sx={{ fontSize: 16 }} />
        Timeline
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/gallery")}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: 13,
          px: 1.5,
          py: 0.25,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minWidth: "auto",
          color: activePage === "gallery" ? "var(--color-text)" : "var(--color-subtext0)",
          bgcolor: activePage === "gallery" ? "var(--color-surface0)" : "transparent",
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        <PhotoLibraryIcon sx={{ fontSize: 16 }} />
        Gallery
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/tree")}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          fontSize: 13,
          px: 1.5,
          py: 0.25,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minWidth: "auto",
          color: activePage === "tree" ? "var(--color-text)" : "var(--color-subtext0)",
          bgcolor: activePage === "tree" ? "var(--color-surface0)" : "transparent",
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        <AccountTreeIcon sx={{ fontSize: 16 }} />
        Tree
      </Button>
    </Box>
  );
}
