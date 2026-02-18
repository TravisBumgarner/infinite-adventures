// @vitest-environment jsdom

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { NoteHistoryEntry } from "shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NoteHistoryModal from "../components/NoteHistoryModal";

const theme = createTheme();

const sampleEntries: NoteHistoryEntry[] = [
	{
		id: "h1",
		noteId: "n1",
		content: "<p>First version</p>",
		snapshotAt: "2026-02-18T10:00:00.000Z",
	},
	{
		id: "h2",
		noteId: "n1",
		content: "<p>Second version</p>",
		snapshotAt: "2026-02-18T11:00:00.000Z",
	},
];

function renderModal(
	overrides: Partial<Parameters<typeof NoteHistoryModal>[0]> = {},
) {
	const props = {
		open: true,
		onClose: vi.fn(),
		entries: sampleEntries,
		loading: false,
		onRevert: vi.fn(),
		...overrides,
	};
	render(
		<ThemeProvider theme={theme}>
			<NoteHistoryModal {...props} />
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

describe("NoteHistoryModal", () => {
	it("calls onRevert with entry content when Revert is clicked", () => {
		const props = renderModal();
		const revertButtons = screen.getAllByRole("button", { name: /revert/i });
		fireEvent.click(revertButtons[0]);
		expect(props.onRevert).toHaveBeenCalledWith(sampleEntries[0].content);
	});

	it("copies entry content to clipboard when Copy is clicked", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: { writeText },
		});

		renderModal();
		const copyButtons = screen.getAllByRole("button", { name: /copy/i });
		fireEvent.click(copyButtons[0]);
		expect(writeText).toHaveBeenCalledWith(sampleEntries[0].content);
	});

	it("shows empty state when there are no entries", () => {
		renderModal({ entries: [] });
		expect(screen.getByText(/no history/i)).toBeDefined();
	});
});
