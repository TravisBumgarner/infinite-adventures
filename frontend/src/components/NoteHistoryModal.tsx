import type { NoteHistoryEntry } from "shared";

interface NoteHistoryModalProps {
	open: boolean;
	onClose: () => void;
	entries: NoteHistoryEntry[];
	loading: boolean;
	onRevert: (content: string) => void;
}

export default function NoteHistoryModal(_props: NoteHistoryModalProps) {
	throw new Error("Not implemented");
}
