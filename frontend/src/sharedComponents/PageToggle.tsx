import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MapIcon from "@mui/icons-material/Map";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import TimelineIcon from "@mui/icons-material/Timeline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { FONT_SIZES } from "../styles/styleConsts";

interface PageToggleProps {
  activePage: "canvas" | "sessions" | "timeline" | "gallery" | "tree";
}

function navButtonSx(isActive: boolean) {
  return {
    fontWeight: 600,
    fontSize: FONT_SIZES.sm,
    px: 1.5,
    py: 0.25,
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    minWidth: "auto",
    color: isActive ? "var(--color-text)" : "var(--color-subtext0)",
    bgcolor: isActive ? "var(--color-surface0)" : "transparent",
    "&:hover": { bgcolor: "var(--color-surface0)" },
  } as const;
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
        sx={navButtonSx(activePage === "canvas")}
      >
        <MapIcon sx={{ fontSize: FONT_SIZES.lg }} />
        Canvas
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/sessions")}
        sx={navButtonSx(activePage === "sessions")}
      >
        <CalendarMonthIcon sx={{ fontSize: FONT_SIZES.lg }} />
        Sessions
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/timeline")}
        sx={navButtonSx(activePage === "timeline")}
      >
        <TimelineIcon sx={{ fontSize: FONT_SIZES.lg }} />
        Timeline
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/gallery")}
        sx={navButtonSx(activePage === "gallery")}
      >
        <PhotoLibraryIcon sx={{ fontSize: FONT_SIZES.lg }} />
        Gallery
      </Button>
      <Button
        size="small"
        onClick={() => navigate("/tree")}
        sx={navButtonSx(activePage === "tree")}
      >
        <AccountTreeIcon sx={{ fontSize: FONT_SIZES.lg }} />
        Tree
      </Button>
    </Box>
  );
}
