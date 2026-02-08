import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
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

  const activePage = location.pathname.startsWith("/sessions") ? "sessions" : "canvas";

  return (
    <>
      <TopBar
        center={<PageToggle activePage={activePage} />}
        right={<SettingsButton onClick={() => setShowSettings(true)} />}
      />
      {children}
      {showSettings && <SettingsSidebar />}
    </>
  );
}
