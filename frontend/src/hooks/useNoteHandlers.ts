import { useCallback } from "react";
import type { CanvasItem, Note } from "shared";
import { DRAFT_NOTE_ID } from "../constants";
import { useDeleteNote } from "./mutations";

interface UseNoteHandlersParams {
  itemId: string;
  getEditingNoteId: () => string | null;
  setEditingNoteId: (id: string | null) => void;
  setNoteContent: (content: string) => void;
  setNoteTitle: (title: string) => void;
  setNotes: (notes: Note[]) => void;
  flushNote: () => void;
  refetchItem: () => Promise<{ data: CanvasItem | undefined }>;
  onItemUpdated?: (item: CanvasItem) => void;
}

export function useNoteHandlers({
  itemId,
  getEditingNoteId,
  setEditingNoteId,
  setNoteContent,
  setNoteTitle,
  setNotes,
  flushNote,
  refetchItem,
  onItemUpdated,
}: UseNoteHandlersParams) {
  const deleteNoteMutation = useDeleteNote(itemId);

  const handleAddNote = useCallback(() => {
    setEditingNoteId(DRAFT_NOTE_ID);
    setNoteContent("");
    setNoteTitle("");
  }, [setEditingNoteId, setNoteContent, setNoteTitle]);

  const handleSelectNote = useCallback(
    (note: Note) => {
      flushNote();
      setEditingNoteId(note.id);
      setNoteContent(note.content);
      setNoteTitle(note.title ?? "");
    },
    [flushNote, setEditingNoteId, setNoteContent, setNoteTitle],
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      if (noteId === DRAFT_NOTE_ID) {
        setEditingNoteId(null);
        setNoteContent("");
        setNoteTitle("");
        return;
      }
      await deleteNoteMutation.mutateAsync(noteId);
      const { data: refreshed } = await refetchItem();
      if (refreshed) {
        setNotes(refreshed.notes);
        onItemUpdated?.(refreshed);
      }
      if (getEditingNoteId() === noteId) {
        setEditingNoteId(null);
        setNoteContent("");
        setNoteTitle("");
      }
    },
    [
      deleteNoteMutation,
      refetchItem,
      onItemUpdated,
      getEditingNoteId,
      setEditingNoteId,
      setNoteContent,
      setNoteTitle,
      setNotes,
    ],
  );

  const handleCloseNote = useCallback(() => {
    if (getEditingNoteId() !== DRAFT_NOTE_ID) {
      flushNote();
    }
    setEditingNoteId(null);
    setNoteContent("");
    setNoteTitle("");
  }, [getEditingNoteId, flushNote, setEditingNoteId, setNoteContent, setNoteTitle]);

  return {
    deleteNoteMutation,
    handleAddNote,
    handleSelectNote,
    handleDeleteNote,
    handleCloseNote,
  };
}
