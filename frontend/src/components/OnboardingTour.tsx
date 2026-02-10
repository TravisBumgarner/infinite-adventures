import type { CallBackProps, Step } from "react-joyride";
import { Joyride, STATUS } from "react-joyride";
import { useCanvasStore } from "../stores/canvasStore";

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    title: "Welcome to Infinite Adventures!",
    content: "Let's walk through the basics so you can start building your campaign.",
  },
  {
    target: '[data-tour="toolbar"]',
    placement: "top",
    disableBeacon: true,
    title: "Create Items",
    content:
      "Click or drag these to add sessions, people, places, things, and events to your canvas.",
  },
  {
    target: '[data-tour="toolbar"]',
    placement: "top",
    disableBeacon: true,
    title: "Edit Items",
    content: "Click any item on the canvas to open it. Add notes, photos, tags, and connections.",
  },
  {
    target: '[data-tour="toolbar"]',
    placement: "top",
    disableBeacon: true,
    title: "Connect Items",
    content: "Drag from one item's edge to another to link them together.",
  },
  {
    target: '[data-tour="page-toggle"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Switch Views",
    content:
      "Canvas for the big picture, Sessions for session notes, Timeline for chronological order, Gallery for photos.",
  },
  {
    target: '[data-tour="search-filter"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Search & Filter",
    content: "Search by name or filter by type and tags to find what you need.",
  },
  {
    target: '[data-tour="tool-sidebar"]',
    placement: "right",
    disableBeacon: true,
    title: "Tools",
    content: "Roll dice, throw 3D dice, and track initiative right from the sidebar.",
  },
  {
    target: '[data-tour="settings-button"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Settings",
    content: "Manage tags, export data, and relaunch this tour anytime.",
  },
];

export default function OnboardingTour() {
  const setShowOnboarding = useCanvasStore((s) => s.setShowOnboarding);

  const handleCallback = (data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setShowOnboarding(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "var(--color-blue)",
          backgroundColor: "var(--color-surface0)",
          textColor: "var(--color-text)",
          arrowColor: "var(--color-surface0)",
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: 14,
        },
        buttonNext: {
          fontSize: 13,
        },
        buttonBack: {
          fontSize: 13,
          color: "var(--color-subtext0)",
        },
        buttonSkip: {
          fontSize: 13,
          color: "var(--color-subtext0)",
        },
      }}
    />
  );
}
