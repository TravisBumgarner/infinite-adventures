import ShareIcon from "@mui/icons-material/Share";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { type ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MODAL_ID, useModalStore } from "../modals";
import CanvasItemPanel from "../pages/Canvas/components/CanvasItemPanel";
import DiceRoller from "../pages/Canvas/components/DiceRoller";
import DiceRoller3d from "../pages/Canvas/components/DiceRoller3d";
import InitiativeTracker from "../pages/Canvas/components/InitiativeTracker";
import QuickNotes from "../pages/Canvas/components/QuickNotes";
import ToolSidebar from "../pages/Canvas/components/ToolSidebar";
import ConnectedCanvasPicker from "../sharedComponents/ConnectedCanvasPicker";
import PageToggle from "../sharedComponents/PageToggle";
import SavingIndicator from "../sharedComponents/SavingIndicator";
import SearchBar from "../sharedComponents/SearchBar";
import SearchBarButton from "../sharedComponents/SearchBarButton";
import TopBar from "../sharedComponents/TopBar";
import { useCanvasStore } from "../stores/canvasStore";
import OnboardingTour from "./OnboardingTour";
import { SettingsButton, SettingsSidebar } from "./SettingsSidebar";

interface MemberLayoutProps {
  children: ReactNode;
}

export default function MemberLayout({ children }: MemberLayoutProps) {
  const location = useLocation();
  const editingItemId = useCanvasStore((s) => s.editingItemId);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setShowSearchBar = useCanvasStore((s) => s.setShowSearchBar);
  const showOnboarding = useCanvasStore((s) => s.showOnboarding);
  const openModal = useModalStore((s) => s.openModal);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchBar(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setShowSearchBar]);

  const activePage = location.pathname.startsWith("/sessions")
    ? "sessions"
    : location.pathname.startsWith("/timeline")
      ? "timeline"
      : location.pathname.startsWith("/gallery")
        ? "gallery"
        : location.pathname.startsWith("/tree")
          ? "tree"
          : "canvas";

  const isCanvasPage = activePage === "canvas";
  const showRightPanel = Boolean(editingItemId) && !isCanvasPage;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar
        left={<ConnectedCanvasPicker />}
        center={
          <>
            <PageToggle activePage={activePage} />
            <SearchBarButton onClick={() => setShowSearchBar(true)} />
          </>
        }
        right={
          <>
            <SavingIndicator />
            <IconButton
              title="Share canvas"
              size="small"
              onClick={() => {
                if (activeCanvasId) {
                  openModal({
                    id: MODAL_ID.SHARE,
                    canvasId: activeCanvasId,
                  });
                }
              }}
              disabled={!activeCanvasId}
              sx={{
                color: "var(--color-subtext0)",
                "&:hover": {
                  bgcolor: "var(--color-surface0)",
                  color: "var(--color-text)",
                },
              }}
            >
              <ShareIcon />
            </IconButton>
            <SettingsButton onClick={() => setShowSettings(true)} />
          </>
        }
      />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Box sx={{ flex: 1, overflow: "auto" }}>{children}</Box>
        {showRightPanel && (
          <CanvasItemPanel itemId={editingItemId!} onClose={() => setEditingItemId(null)} />
        )}
      </Box>
      <SearchBar />
      <ToolSidebar />
      <DiceRoller />
      <DiceRoller3d />
      <InitiativeTracker />
      <QuickNotes />
      {showSettings && <SettingsSidebar />}
      {showOnboarding && <OnboardingTour />}
    </Box>
  );
}
