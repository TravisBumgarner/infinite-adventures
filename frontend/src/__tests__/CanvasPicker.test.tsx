// @vitest-environment jsdom

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CanvasPicker from "../pages/Canvas/components/CanvasPicker";

// Mock the modal store
const mockOpenModal = vi.fn();
vi.mock("../modals", () => ({
  MODAL_ID: {
    CANVAS_SETTINGS: "CANVAS_SETTINGS",
    CREATE_CANVAS: "CREATE_CANVAS",
  },
  useModalStore: vi.fn((selector) => {
    const state = { openModal: mockOpenModal };
    return selector(state);
  }),
}));

const theme = createTheme();

const defaultCanvases = [
  { id: "c1", name: "Default" },
  { id: "c2", name: "Battle Map" },
];

function renderPicker(overrides: Partial<Parameters<typeof CanvasPicker>[0]> = {}) {
  const props = {
    canvases: defaultCanvases,
    activeCanvasId: "c1",
    onSwitch: vi.fn(),
    onCreate: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(
    <ThemeProvider theme={theme}>
      <CanvasPicker {...props} />
    </ThemeProvider>,
  );
  return props;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("CanvasPicker", () => {
  describe("display", () => {
    it("shows the active canvas name", () => {
      renderPicker();
      expect(screen.getByText("Default")).toBeDefined();
    });
  });

  describe("switching canvases", () => {
    it("calls onSwitch when selecting a different canvas", () => {
      const props = renderPicker();

      // Open the dropdown
      fireEvent.click(screen.getByText("Default"));

      // Select the other canvas
      fireEvent.click(screen.getByText("Battle Map"));

      expect(props.onSwitch).toHaveBeenCalledWith("c2");
    });
  });

  describe("creating a canvas", () => {
    it("opens create canvas modal when clicking New Canvas", () => {
      const props = renderPicker();

      fireEvent.click(screen.getByText("Default"));
      fireEvent.click(screen.getByText("New Canvas"));

      expect(mockOpenModal).toHaveBeenCalledWith({
        id: "CREATE_CANVAS",
        onCreate: props.onCreate,
      });
    });
  });

  describe("settings", () => {
    it("opens settings modal when clicking Canvas Settings", () => {
      renderPicker();

      fireEvent.click(screen.getByText("Default"));
      fireEvent.click(screen.getByText("Canvas Settings"));

      expect(mockOpenModal).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "CANVAS_SETTINGS",
          canvasId: "c1",
          canvasName: "Default",
          canDelete: true,
        }),
      );
    });

    it("passes canDelete=false when only one canvas exists", () => {
      renderPicker({ canvases: [{ id: "c1", name: "Default" }] });

      fireEvent.click(screen.getByText("Default"));
      fireEvent.click(screen.getByText("Canvas Settings"));

      expect(mockOpenModal).toHaveBeenCalledWith(
        expect.objectContaining({
          canDelete: false,
        }),
      );
    });
  });
});
