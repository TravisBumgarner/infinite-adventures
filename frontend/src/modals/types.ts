import type { CanvasItemType, Photo } from "shared";

export type LightboxPhoto = Photo & {
  parentItemId?: string;
  parentItemType?: CanvasItemType;
  parentItemTitle?: string;
};

// Modal IDs
export const MODAL_ID = {
  DELETE_ITEM: "DELETE_ITEM",
  BULK_DELETE: "BULK_DELETE",
  LIGHTBOX: "LIGHTBOX",
  ITEM_SETTINGS: "ITEM_SETTINGS",
  CANVAS_SETTINGS: "CANVAS_SETTINGS",
  CREATE_CANVAS: "CREATE_CANVAS",
  CROP_PHOTO: "CROP_PHOTO",
} as const;

export type ModalId = (typeof MODAL_ID)[keyof typeof MODAL_ID];

// Individual modal prop types
export interface DeleteItemModalProps {
  id: typeof MODAL_ID.DELETE_ITEM;
  itemId: string;
  itemTitle: string;
  onConfirm: () => void;
}

export interface BulkDeleteModalProps {
  id: typeof MODAL_ID.BULK_DELETE;
  itemCount: number;
  onConfirm: () => void;
}

export interface LightboxModalProps {
  id: typeof MODAL_ID.LIGHTBOX;
  photos: LightboxPhoto[];
  initialIndex: number;
  onDelete?: (photoId: string) => void;
  onSelect?: (photoId: string) => void;
  onToggleImportant?: (photoId: string) => void;
  onUpdateCaption?: (photoId: string, caption: string) => void;
}

export interface ItemSettingsModalProps {
  id: typeof MODAL_ID.ITEM_SETTINGS;
  itemId: string;
  onDeleteClick: () => void;
}

export interface CanvasSettingsModalProps {
  id: typeof MODAL_ID.CANVAS_SETTINGS;
  canvasId: string;
  canvasName: string;
  onRename: (newName: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export interface CreateCanvasModalProps {
  id: typeof MODAL_ID.CREATE_CANVAS;
  onCreate: (name: string) => void;
}

export interface CropPhotoModalProps {
  id: typeof MODAL_ID.CROP_PHOTO;
  photoUrl: string;
  aspectRatio?: number;
  initialCropX?: number;
  initialCropY?: number;
  onConfirm: (cropX: number, cropY: number) => void;
}

// Union type of all modals
export type ActiveModal =
  | DeleteItemModalProps
  | BulkDeleteModalProps
  | LightboxModalProps
  | ItemSettingsModalProps
  | CanvasSettingsModalProps
  | CreateCanvasModalProps
  | CropPhotoModalProps;
