import BulkDeleteModal from "./components/BulkDeleteModal";
import CanvasSettingsModal from "./components/CanvasSettingsModal";
import CreateCanvasModal from "./components/CreateCanvasModal";
import CropPhotoModal from "./components/CropPhotoModal";
import DeleteItemModal from "./components/DeleteItemModal";
import ItemSettingsModal from "./components/ItemSettingsModal";
import LightboxModal from "./components/LightboxModal";
import ShareModal from "./components/ShareModal";
import { useModalStore } from "./store";
import { MODAL_ID } from "./types";

export default function ModalRenderer() {
  const activeModal = useModalStore((s) => s.activeModal);

  if (!activeModal) return null;

  switch (activeModal.id) {
    case MODAL_ID.DELETE_ITEM:
      return <DeleteItemModal {...activeModal} />;
    case MODAL_ID.BULK_DELETE:
      return <BulkDeleteModal {...activeModal} />;
    case MODAL_ID.LIGHTBOX:
      return <LightboxModal {...activeModal} />;
    case MODAL_ID.ITEM_SETTINGS:
      return <ItemSettingsModal {...activeModal} />;
    case MODAL_ID.CANVAS_SETTINGS:
      return <CanvasSettingsModal {...activeModal} />;
    case MODAL_ID.CREATE_CANVAS:
      return <CreateCanvasModal {...activeModal} />;
    case MODAL_ID.CROP_PHOTO:
      return <CropPhotoModal {...activeModal} />;
    case MODAL_ID.SHARE:
      return <ShareModal {...activeModal} />;
    default:
      return null;
  }
}
