// @vitest-environment jsdom

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CanvasPicker from "../pages/Canvas/components/CanvasPicker";

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

      // Open the dropdown/select
      fireEvent.mouseDown(screen.getByText("Default"));

      // Select the other canvas
      fireEvent.click(screen.getByText("Battle Map"));

      expect(props.onSwitch).toHaveBeenCalledWith("c2");
    });
  });

  describe("creating a canvas", () => {
    it("calls onCreate when clicking New Canvas", () => {
      const props = renderPicker();

      fireEvent.mouseDown(screen.getByText("Default"));
      fireEvent.click(screen.getByText("New Canvas"));

      expect(props.onCreate).toHaveBeenCalled();
    });
  });

  describe("renaming", () => {
    it("enters rename mode and submits the new name", () => {
      const props = renderPicker();

      // Click the rename button
      fireEvent.click(screen.getByTitle("Rename canvas"));

      // Type a new name and submit
      const input = screen.getByDisplayValue("Default");
      fireEvent.change(input, { target: { value: "World Map" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(props.onRename).toHaveBeenCalledWith("c1", "World Map");
    });
  });

  describe("deleting", () => {
    it("calls onDelete after confirmation", () => {
      const props = renderPicker();

      fireEvent.click(screen.getByTitle("Delete canvas"));

      // Confirm deletion
      fireEvent.click(screen.getByText("Confirm"));

      expect(props.onDelete).toHaveBeenCalledWith("c1");
    });

    it("disables delete button when only one canvas exists", () => {
      renderPicker({ canvases: [{ id: "c1", name: "Default" }] });

      const deleteButton = screen.getByTitle("Delete canvas");
      expect(deleteButton).toHaveProperty("disabled", true);
    });
  });
});
