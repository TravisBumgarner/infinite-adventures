import { useCallback } from "react";
import type { CanvasItem, Note } from "shared";
import { DRAFT_NOTE_ID } from "../constants";
import { useDeleteNote } from "./mutations";

interface UseNoteHandlersParams {
  itemId: string;
  getEditingNoteId: () => string | null;
  getRealNoteId: () => string | null;
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
  getRealNoteId,
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
      // Draft that was never persisted
      if (noteId === DRAFT_NOTE_ID && getRealNoteId() === DRAFT_NOTE_ID) {
        setEditingNoteId(null);
        setNoteContent("");
        setNoteTitle("");
        return;
      }
      // Draft that was already persisted — delete using the real server ID
      const idToDelete = noteId === DRAFT_NOTE_ID ? getRealNoteId()! : noteId;
      await deleteNoteMutation.mutateAsync(idToDelete);
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
      getRealNoteId,
      setEditingNoteId,
      setNoteContent,
      setNoteTitle,
      setNotes,
    ],
  );

  const handleCloseNote = useCallback(async () => {
    const editingId = getEditingNoteId();
    if (editingId && editingId !== DRAFT_NOTE_ID) {
      flushNote();
    }
    setEditingNoteId(null);
    setNoteContent("");
    setNoteTitle("");
    // Refetch to get server-sorted notes (new note in proper position)
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setNotes(refreshed.notes);
      onItemUpdated?.(refreshed);
    }
  }, [
    getEditingNoteId,
    flushNote,
    setEditingNoteId,
    setNoteContent,
    setNoteTitle,
    refetchItem,
    setNotes,
    onItemUpdated,
  ]);

  return {
    deleteNoteMutation,
    handleAddNote,
    handleSelectNote,
    handleDeleteNote,
    handleCloseNote,
  };
}
