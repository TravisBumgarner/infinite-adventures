import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import DiceRoller from "../pages/Canvas/components/DiceRoller";
import DiceRoller3d from "../pages/Canvas/components/DiceRoller3d";
import InitiativeTracker from "../pages/Canvas/components/InitiativeTracker";
import ToolSidebar from "../pages/Canvas/components/ToolSidebar";
import PageToggle from "../sharedComponents/PageToggle";
import TopBar from "../sharedComponents/TopBar";
import { useCanvasStore } from "../stores/canvasStore";
import { SettingsButton, SettingsSidebar } from "./SettingsSidebar";

interface MemberLayoutProps {
  children: ReactNode;
}

export default function MemberLayout({ children }: MemberLayoutProps) {
  const location = useLocation();
  const showSettings = useCanvasStore((s) => s.showSettings);
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);

  const activePage = location.pathname.startsWith("/sessions")
    ? "sessions"
    : location.pathname.startsWith("/timeline")
      ? "timeline"
      : "canvas";

  return (
    <>
      <TopBar
        center={<PageToggle activePage={activePage} />}
        right={<SettingsButton onClick={() => setShowSettings(true)} />}
      />
      {children}
      <ToolSidebar />
      <DiceRoller />
      <DiceRoller3d />
      <InitiativeTracker />
      {showSettings && <SettingsSidebar />}
    </>
  );
}
