import DeleteItemModal from "./components/DeleteItemModal";
import ItemSettingsModal from "./components/ItemSettingsModal";
import LightboxModal from "./components/LightboxModal";
import { useModalStore } from "./store";
import { MODAL_ID } from "./types";

export default function ModalRenderer() {
  const activeModal = useModalStore((s) => s.activeModal);

  if (!activeModal) return null;

  switch (activeModal.id) {
    case MODAL_ID.DELETE_ITEM:
      return <DeleteItemModal {...activeModal} />;
    case MODAL_ID.LIGHTBOX:
      return <LightboxModal {...activeModal} />;
    case MODAL_ID.ITEM_SETTINGS:
      return <ItemSettingsModal {...activeModal} />;
    default:
      return null;
  }
}
