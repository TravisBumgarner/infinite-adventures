import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useCreateShare, useDeleteShare } from "../../hooks/mutations";
import { useShares } from "../../hooks/queries";
import { useAppStore } from "../../stores/appStore";
import { useCanvasStore } from "../../stores/canvasStore";
import { useModalStore } from "../store";
import type { ShareModalProps } from "../types";
import BaseModal from "./BaseModal";

export default function ShareModal({ canvasId, itemId, itemTitle }: ShareModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);
  const showToast = useAppStore((s) => s.showToast);
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const setSettingsTab = useCanvasStore((s) => s.setSettingsTab);
  const { data: shares } = useShares(canvasId);
  const createMutation = useCreateShare(canvasId);
  const deleteMutation = useDeleteShare(canvasId);

  const existingShare = shares?.find((s) => (itemId ? s.itemId === itemId : s.itemId === null));

  const shareUrl = existingShare ? `${window.location.origin}/shared/${existingShare.token}` : null;

  const handleCreate = () => {
    createMutation.mutate(itemId);
  };

  const handleRevoke = () => {
    if (existingShare) {
      deleteMutation.mutate(existingShare.id);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied to clipboard");
    }
  };

  const handleManageInSettings = () => {
    closeModal();
    setSettingsTab("sharing");
    setShowSettings(true);
  };

  const title = itemId ? `Share "${itemTitle ?? "Item"}"` : "Share Canvas";

  return (
    <BaseModal title={title} maxWidth="xs">
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {existingShare ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "var(--color-surface0)",
                borderRadius: 1,
                px: 1.5,
                py: 1,
              }}
            >
              <LinkIcon sx={{ color: "var(--color-green)", fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--color-text)",
                }}
              >
                {shareUrl}
              </Typography>
              <IconButton size="small" onClick={handleCopy} title="Copy link">
                <ContentCopyIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LinkOffIcon />}
              onClick={handleRevoke}
              disabled={deleteMutation.isPending}
              size="small"
            >
              Revoke Link
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Share Link"}
          </Button>
        )}
        <Typography
          variant="body2"
          sx={{
            color: "var(--color-subtext0)",
            cursor: "pointer",
            textAlign: "center",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={handleManageInSettings}
        >
          Manage all shares in Settings
        </Typography>
      </DialogContent>
    </BaseModal>
  );
}
