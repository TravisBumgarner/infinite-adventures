import type React from "react";
import { useCallback } from "react";
import type { CanvasItem, Photo } from "shared";
import {
  useDeletePhoto,
  useSelectPhoto,
  useTogglePhotoImportant,
  useUpdatePhotoCaption,
  useUploadPhoto,
} from "./mutations";

interface UsePhotoHandlersParams {
  itemId: string;
  canvasId: string;
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  refetchItem: () => Promise<{ data: CanvasItem | undefined }>;
  onItemUpdated?: (item: CanvasItem) => void;
}

export function usePhotoHandlers({
  itemId,
  canvasId,
  setPhotos,
  refetchItem,
  onItemUpdated,
}: UsePhotoHandlersParams) {
  const uploadPhotoMutation = useUploadPhoto(itemId, canvasId);
  const deletePhotoMutation = useDeletePhoto(itemId, canvasId);
  const selectPhotoMutation = useSelectPhoto(itemId, canvasId);
  const togglePhotoImportantMutation = useTogglePhotoImportant(itemId, canvasId);
  const updatePhotoCaptionMutation = useUpdatePhotoCaption(itemId, canvasId);

  const handleFileUpload = useCallback(
    async (file: File) => {
      await uploadPhotoMutation.mutateAsync(file);
      const { data: updated } = await refetchItem();
      if (updated) {
        setPhotos(updated.photos);
        onItemUpdated?.(updated);
      }
    },
    [uploadPhotoMutation, refetchItem, setPhotos, onItemUpdated],
  );

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handlePhotoDelete = useCallback(
    async (photoId: string) => {
      await deletePhotoMutation.mutateAsync(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      const { data: updated } = await refetchItem();
      if (updated) {
        onItemUpdated?.(updated);
      }
    },
    [deletePhotoMutation, refetchItem, setPhotos, onItemUpdated],
  );

  const handlePhotoSelect = useCallback(
    async (photoId: string) => {
      await selectPhotoMutation.mutateAsync(photoId);
      const { data: updated } = await refetchItem();
      if (updated) {
        setPhotos(updated.photos);
        onItemUpdated?.(updated);
      }
    },
    [selectPhotoMutation, refetchItem, setPhotos, onItemUpdated],
  );

  const handleTogglePhotoImportant = useCallback(
    async (photoId: string) => {
      await togglePhotoImportantMutation.mutateAsync(photoId);
      const { data: updated } = await refetchItem();
      if (updated) {
        setPhotos(updated.photos);
        onItemUpdated?.(updated);
      }
    },
    [togglePhotoImportantMutation, refetchItem, setPhotos, onItemUpdated],
  );

  const handleFileDrop = useCallback(
    async (file: File) => {
      await handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleUpdateCaption = useCallback(
    async (photoId: string, caption: string) => {
      await updatePhotoCaptionMutation.mutateAsync({ photoId, caption });
      const { data: updated } = await refetchItem();
      if (updated) {
        setPhotos(updated.photos);
        onItemUpdated?.(updated);
      }
    },
    [updatePhotoCaptionMutation, refetchItem, setPhotos, onItemUpdated],
  );

  return {
    handlePhotoUpload,
    handlePhotoDelete,
    handlePhotoSelect,
    handleTogglePhotoImportant,
    handleFileDrop,
    handleUpdateCaption,
  };
}
