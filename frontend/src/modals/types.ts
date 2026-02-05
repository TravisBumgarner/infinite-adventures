import type { Photo } from "shared";

// Modal IDs
export const MODAL_ID = {
  DELETE_ITEM: "DELETE_ITEM",
  LIGHTBOX: "LIGHTBOX",
  ITEM_SETTINGS: "ITEM_SETTINGS",
} as const;

export type ModalId = (typeof MODAL_ID)[keyof typeof MODAL_ID];

// Individual modal prop types
export interface DeleteItemModalProps {
  id: typeof MODAL_ID.DELETE_ITEM;
  itemId: string;
  itemTitle: string;
  onConfirm: () => void;
}

export interface LightboxModalProps {
  id: typeof MODAL_ID.LIGHTBOX;
  photos: Photo[];
  initialIndex: number;
}

export interface ItemSettingsModalProps {
  id: typeof MODAL_ID.ITEM_SETTINGS;
  itemId: string;
  onDeleteClick: () => void;
}

// Union type of all modals
export type ActiveModal = DeleteItemModalProps | LightboxModalProps | ItemSettingsModalProps;
