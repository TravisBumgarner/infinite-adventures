import Box from "@mui/material/Box";
import { type ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SIDEBAR_WIDTH } from "../constants";
import CanvasItemPanel from "../pages/Canvas/components/CanvasItemPanel";
import DiceRoller from "../pages/Canvas/components/DiceRoller";
import DiceRoller3d from "../pages/Canvas/components/DiceRoller3d";
import InitiativeTracker from "../pages/Canvas/components/InitiativeTracker";
import QuickNotes from "../pages/Canvas/components/QuickNotes";
import ToolSidebar from "../pages/Canvas/components/ToolSidebar";
import ConnectedCanvasPicker from "../sharedComponents/ConnectedCanvasPicker";
import PageToggle from "../sharedComponents/PageToggle";
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
  const setShowSearchBar = useCanvasStore((s) => s.setShowSearchBar);
  const showOnboarding = useCanvasStore((s) => s.showOnboarding);

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
    <>
      <TopBar
        left={<ConnectedCanvasPicker />}
        center={
          <>
            <PageToggle activePage={activePage} />
            <SearchBarButton onClick={() => setShowSearchBar(true)} />
          </>
        }
        right={<SettingsButton onClick={() => setShowSettings(true)} />}
      />
      <Box
        sx={{
          marginRight: showRightPanel ? `${SIDEBAR_WIDTH}px` : 0,
          transition: "margin-right 0.2s",
        }}
      >
        {children}
      </Box>
      <SearchBar />
      <ToolSidebar />
      <DiceRoller />
      <DiceRoller3d />
      <InitiativeTracker />
      <QuickNotes />
      {showSettings && <SettingsSidebar />}
      {showOnboarding && <OnboardingTour />}
      {showRightPanel && (
        <CanvasItemPanel itemId={editingItemId!} onClose={() => setEditingItemId(null)} />
      )}
    </>
  );
}
