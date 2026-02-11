import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCanvasInput,
  CreateCanvasItemInput,
  CreateNoteInput,
  CreateTagInput,
  UpdateCanvasInput,
  UpdateCanvasItemInput,
  UpdateNoteInput,
  UpdateTagInput,
} from "shared";
import {
  addTagToItem,
  createCanvas,
  createItem,
  createLink,
  createNote,
  createQuickNote,
  createTag,
  deleteCanvas,
  deleteItem,
  deleteLink,
  deleteNote,
  deletePhoto,
  deleteQuickNote,
  deleteTag,
  importCanvas,
  removeTagFromItem,
  selectPhoto,
  togglePhotoImportant,
  updateCanvas,
  updateItem,
  updateNote,
  updatePhotoCaption,
  updateQuickNote,
  updateTag,
  uploadPhoto,
} from "../../api/client.js";
import { queryKeys } from "../queries/queryKeys.js";

// --- Canvas mutations ---

export function useCreateCanvas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCanvasInput) => createCanvas(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.canvases.all });
    },
  });
}

export function useUpdateCanvas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCanvasInput }) =>
      updateCanvas(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.canvases.all });
    },
  });
}

export function useDeleteCanvas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCanvas(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.canvases.all });
    },
  });
}

// --- Item mutations ---

export function useCreateItem(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCanvasItemInput) => createItem(canvasId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.list(canvasId) });
    },
  });
}

export function useUpdateItem(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCanvasItemInput }) =>
      updateItem(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

export function useDeleteItem(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.list(canvasId) });
    },
  });
}

// --- Note mutations ---

export function useCreateNote(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(itemId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
    },
  });
}

export function useUpdateNote(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: UpdateNoteInput }) =>
      updateNote(noteId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
    },
  });
}

export function useDeleteNote(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
    },
  });
}

// --- Photo mutations ---

export function useUploadPhoto(itemId: string, canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadPhoto(itemId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

export function useDeletePhoto(itemId: string, canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deletePhoto(photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

export function useSelectPhoto(itemId: string, canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => selectPhoto(photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

export function useTogglePhotoImportant(itemId: string, canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => togglePhotoImportant(photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
      qc.invalidateQueries({
        queryKey: ["canvases", canvasId, "gallery"],
      });
    },
  });
}

export function useUpdatePhotoCaption(itemId: string, canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, caption }: { photoId: string; caption: string }) =>
      updatePhotoCaption(photoId, caption),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

// --- Tag mutations ---

export function useCreateTag(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTagInput) => createTag(canvasId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tags.list(canvasId) });
    },
  });
}

export function useUpdateTag(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, input }: { tagId: string; input: UpdateTagInput }) =>
      updateTag(canvasId, tagId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tags.list(canvasId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

export function useDeleteTag(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => deleteTag(canvasId, tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tags.list(canvasId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

export function useAddTagToItem(itemId: string, canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => addTagToItem(itemId, tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

export function useRemoveTagFromItem(itemId: string, canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => removeTagFromItem(itemId, tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

// --- Link mutations ---

export function useCreateLink(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceItemId, targetItemId }: { sourceItemId: string; targetItemId: string }) =>
      createLink(sourceItemId, targetItemId),
    onSuccess: (_data, { sourceItemId, targetItemId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.items.detail(sourceItemId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.items.detail(targetItemId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

export function useDeleteLink(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceItemId, targetItemId }: { sourceItemId: string; targetItemId: string }) =>
      deleteLink(sourceItemId, targetItemId),
    onSuccess: (_data, { sourceItemId, targetItemId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.items.detail(sourceItemId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.items.detail(targetItemId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.items.list(canvasId) });
    },
  });
}

// --- Quick Note mutations ---

export function useCreateQuickNote(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content?: string) => createQuickNote(canvasId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.quickNotes.list(canvasId) });
    },
  });
}

export function useUpdateQuickNote(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateQuickNote(canvasId, id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.quickNotes.list(canvasId) });
    },
  });
}

export function useDeleteQuickNote(canvasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuickNote(canvasId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.quickNotes.list(canvasId) });
    },
  });
}

// --- Backup mutations ---

export function useImportCanvas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importCanvas(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.canvases.all });
    },
  });
}
