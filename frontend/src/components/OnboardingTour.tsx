import { useEffect, useRef, useState } from "react";
import type { CallBackProps, Step } from "react-joyride";
import { ACTIONS, EVENTS, Joyride, STATUS } from "react-joyride";
import { useCanvasStore } from "../stores/canvasStore";
import { FONT_SIZES } from "../styles/styleConsts";

const STEP_CREATE = 1;
const STEP_PANEL = 2;
const STEP_DELETE = 3;

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    disableBeacon: true,
    title: "Welcome to Infinite Adventures!",
    content: "Let's walk through the basics. You'll create an item, explore it, then clean up.",
  },
  {
    target: '[data-tour="toolbar"]',
    placement: "top",
    disableBeacon: true,
    spotlightClicks: true,
    hideFooter: true,
    title: "Create Your First Item",
    content: "Click any item type below to add it to your canvas.",
  },
  {
    target: '[data-tour="item-panel"]',
    placement: "left",
    disableBeacon: true,
    disableOverlay: true,
    title: "The Item Panel",
    content: "This is where you edit your item — title, summary, notes, photos, and connections.",
  },
  {
    target: '[data-tour="panel-menu"]',
    placement: "left",
    disableBeacon: true,
    disableOverlay: true,
    hideFooter: true,
    title: "Now Delete It",
    content: 'Click the \u22EE menu and select "Delete Item" to remove it.',
  },
  {
    target: '[data-tour="page-toggle"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Switch Views",
    content:
      "Canvas for the big picture, Sessions for notes, Timeline for chronological order, Gallery for photos.",
  },
  {
    target: '[data-tour="search-button"]',
    placement: "bottom",
    disableBeacon: true,
    title: "Search",
    content: "Search across all items and notes. You can also press ⌘K to open it anytime.",
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
  const editingItemId = useCanvasStore((s) => s.editingItemId);
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(true);
  const prevEditingRef = useRef(editingItemId);

  // Advance interactive steps based on store state changes
  useEffect(() => {
    const prev = prevEditingRef.current;
    prevEditingRef.current = editingItemId;

    // Item created: advance from Create step to Panel step
    if (stepIndex === STEP_CREATE && prev == null && editingItemId != null) {
      setRun(false);
      setTimeout(() => {
        setStepIndex(STEP_PANEL);
        setRun(true);
      }, 400);
    }

    // Item deleted/closed: advance from Delete step to next informational step
    if (stepIndex === STEP_DELETE && prev != null && editingItemId == null) {
      setRun(false);
      setTimeout(() => {
        setStepIndex(STEP_DELETE + 1);
        setRun(true);
      }, 400);
    }
  }, [editingItemId, stepIndex]);

  const handleCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setShowOnboarding(false);
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      stepIndex={stepIndex}
      run={run}
      continuous
      showSkipButton
      showProgress
      hideBackButton
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
          fontSize: FONT_SIZES.lg,
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: FONT_SIZES.md,
        },
        buttonNext: {
          fontSize: FONT_SIZES.sm,
        },
        buttonBack: {
          fontSize: FONT_SIZES.sm,
          color: "var(--color-subtext0)",
        },
        buttonSkip: {
          fontSize: FONT_SIZES.sm,
          color: "var(--color-subtext0)",
        },
      }}
    />
  );
}
