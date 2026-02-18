import type { NoteHistoryEntry } from "shared";

export async function createSnapshot(_noteId: string, _content: string): Promise<NoteHistoryEntry> {
  throw new Error("Not implemented");
}

export async function listHistory(_noteId: string): Promise<NoteHistoryEntry[]> {
  throw new Error("Not implemented");
}
