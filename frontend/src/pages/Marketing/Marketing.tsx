import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import CollectionsIcon from "@mui/icons-material/Collections";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import GroupsIcon from "@mui/icons-material/Groups";
import HubIcon from "@mui/icons-material/Hub";
import ImageIcon from "@mui/icons-material/Image";
import LightModeIcon from "@mui/icons-material/LightMode";
import MapIcon from "@mui/icons-material/Map";
import NotesIcon from "@mui/icons-material/Notes";
import PersonIcon from "@mui/icons-material/Person";
import PlaceIcon from "@mui/icons-material/Place";
import SearchIcon from "@mui/icons-material/Search";
import WidgetsIcon from "@mui/icons-material/Widgets";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import { useThemePreference } from "../../styles/Theme";

const ITEM_TYPES = [
  { label: "Person", color: "#f5c2e7", icon: <PersonIcon fontSize="small" /> },
  { label: "Place", color: "#94e2d5", icon: <PlaceIcon fontSize="small" /> },
  { label: "Thing", color: "#f9e2af", icon: <WidgetsIcon fontSize="small" /> },
  { label: "Session", color: "#cba6f7", icon: <AutoStoriesIcon fontSize="small" /> },
  { label: "Event", color: "#89b4fa", icon: <NotesIcon fontSize="small" /> },
];

const FEATURES = [
  {
    icon: <MapIcon sx={{ fontSize: 40 }} />,
    title: "Infinite Canvas",
    description:
      "An endless workspace to map out your entire world. Pan, zoom, and organize freely without limits.",
  },
  {
    icon: <HubIcon sx={{ fontSize: 40 }} />,
    title: "Visual Connections",
    description:
      "Draw lines between related items to visualize relationships. See how characters, places, and events interconnect.",
  },
  {
    icon: <NotesIcon sx={{ fontSize: 40 }} />,
    title: "Rich Notes",
    description:
      "Add detailed notes with formatting. Use @mentions to link to other items directly in your text.",
  },
  {
    icon: <CollectionsIcon sx={{ fontSize: 40 }} />,
    title: "Photo Galleries",
    description:
      "Attach reference images to any item. Build visual libraries for characters, locations, and artifacts.",
  },
  {
    icon: <SearchIcon sx={{ fontSize: 40 }} />,
    title: "Powerful Search",
    description:
      "Find anything instantly. Search across all your items and jump directly to what you need.",
  },
  {
    icon: <FilterAltIcon sx={{ fontSize: 40 }} />,
    title: "Smart Filters",
    description:
      "Filter your canvas by item type. Focus on just characters, or just locations, with a click.",
  },
  {
    icon: <ImageIcon sx={{ fontSize: 40 }} />,
    title: "Export to Image",
    description:
      "Export your canvas as a high-quality image. Perfect for sharing or printing your world maps.",
  },
  {
    icon: <DarkModeIcon sx={{ fontSize: 40 }} />,
    title: "Dark & Light Themes",
    description:
      "Work comfortably day or night. Choose dark mode, light mode, or follow your system preference.",
  },
];

export default function Marketing() {
  const theme = useTheme();
  const { effectiveMode, setPreference } = useThemePreference();

  const toggleTheme = () => {
    setPreference(effectiveMode === "dark" ? "light" : "dark");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        overflow: "auto",
        bgcolor: "var(--color-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: 3,
          borderBottom: "1px solid var(--color-surface1)",
          position: "sticky",
          top: 0,
          bgcolor: "var(--color-base)",
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--color-text)" }}>
              Infinite Adventures
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                onClick={toggleTheme}
                title={effectiveMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                sx={{ color: "var(--color-subtext0)" }}
              >
                {effectiveMode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <Button component={Link} to="/login" variant="text">
                Log in
              </Button>
              <Button component={Link} to="/signup" variant="contained">
                Sign up free
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: `linear-gradient(180deg, var(--color-base) 0%, var(--color-mantle) 100%)`,
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 800,
                color: "var(--color-text)",
                fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4rem" },
                lineHeight: 1.1,
              }}
            >
              Map Your Story
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "var(--color-subtext0)",
                maxWidth: 650,
                lineHeight: 1.7,
                fontSize: { xs: "1.1rem", md: "1.25rem" },
              }}
            >
              A visual canvas for worldbuilders, game masters, and storytellers. Connect characters,
              places, and events in an infinite space. See the big picture of your universe.
            </Typography>

            {/* Item type chips */}
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ gap: 1 }}
            >
              {ITEM_TYPES.map((type) => (
                <Chip
                  key={type.label}
                  icon={type.icon}
                  label={type.label}
                  sx={{
                    bgcolor: type.color,
                    color: theme.palette.getContrastText(type.color),
                    fontWeight: 600,
                    "& .MuiChip-icon": {
                      color: "inherit",
                    },
                  }}
                />
              ))}
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                size="large"
                sx={{ px: 4, py: 1.5, fontSize: "1.1rem" }}
              >
                Start Building Your World
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Log in
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Grid */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "var(--color-base)" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              color: "var(--color-text)",
              textAlign: "center",
              mb: 6,
              fontSize: { xs: "1.75rem", md: "2.5rem" },
            }}
          >
            Everything you need to build your world
          </Typography>

          <Grid container spacing={3}>
            {FEATURES.map((feature) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={feature.title}>
                <Card
                  sx={{
                    height: "100%",
                    bgcolor: "var(--color-surface0)",
                    border: "1px solid var(--color-surface1)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 24px var(--color-backdrop)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ color: "var(--color-mauve)", mb: 2 }}>{feature.icon}</Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "var(--color-text)", mb: 1 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Use Cases */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: "var(--color-mantle)" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              color: "var(--color-text)",
              textAlign: "center",
              mb: 2,
              fontSize: { xs: "1.75rem", md: "2.5rem" },
            }}
          >
            Built for storytellers
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "var(--color-subtext0)",
              textAlign: "center",
              mb: 6,
              maxWidth: 600,
              mx: "auto",
            }}
          >
            Whether you're running a campaign, writing a novel, or building a universe, Infinite
            Adventures helps you keep track of it all.
          </Typography>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: "var(--color-surface0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AutoStoriesIcon sx={{ fontSize: 40, color: "var(--color-mauve)" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: "var(--color-text)" }}>
                  Game Masters
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
                  Track NPCs, locations, plot threads, and session notes. Never lose track of that
                  important detail your players will ask about three sessions later.
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: "var(--color-surface0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <NotesIcon sx={{ fontSize: 40, color: "var(--color-mauve)" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: "var(--color-text)" }}>
                  Writers
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
                  Map character relationships, plot timelines, and world details. See your story's
                  structure at a glance and catch inconsistencies before they become problems.
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: "var(--color-surface0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GroupsIcon sx={{ fontSize: 40, color: "var(--color-mauve)" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: "var(--color-text)" }}>
                  Worldbuilders
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
                  Build rich, interconnected universes. Document cultures, histories, and
                  geographies. Create a living reference for your fictional world.
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: "var(--color-base)" }}>
        <Container maxWidth="sm">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "var(--color-text)",
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              Ready to start your adventure?
            </Typography>
            <Typography variant="body1" sx={{ color: "var(--color-subtext0)" }}>
              Create your free account and start mapping your world today.
            </Typography>
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              size="large"
              sx={{ px: 5, py: 1.5, fontSize: "1.1rem" }}
            >
              Get Started Free
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 3,
          borderTop: "1px solid var(--color-surface1)",
          bgcolor: "var(--color-mantle)",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" sx={{ color: "var(--color-overlay0)" }}>
              Infinite Adventures — Built for storytellers everywhere
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button
                component="a"
                href="https://discord.com/invite/J8jwMxEEff"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: "var(--color-subtext0)" }}
              >
                Discord
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
