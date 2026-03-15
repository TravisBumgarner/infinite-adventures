import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { Share } from "shared";
import { useDeleteShare } from "../../hooks/mutations";
import { useShares } from "../../hooks/queries";
import { CanvasItemTypeBadge } from "../../sharedComponents/LabelBadge";
import { useAppStore } from "../../stores/appStore";
import { useCanvasStore } from "../../stores/canvasStore";

function ShareRow({ share }: { share: Share }) {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const showToast = useAppStore((s) => s.showToast);
  const deleteMutation = useDeleteShare(activeCanvasId ?? "");

  const shareUrl = `${window.location.origin}/shared/${share.token}`;
  const label = share.itemId ? (share.itemTitle ?? "Item") : "Entire Canvas";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    showToast("Link copied to clipboard");
  };

  return (
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
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
        {share.itemId && share.itemType && (
          <CanvasItemTypeBadge
            type={share.itemType}
            accentColor="var(--color-surface1)"
            height={18}
          />
        )}
      </Box>
      <IconButton size="small" onClick={handleCopy} title="Copy link">
        <ContentCopyIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => deleteMutation.mutate(share.id)}
        disabled={deleteMutation.isPending}
        title="Revoke link"
        sx={{ color: "var(--color-red)" }}
      >
        <LinkOffIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

export default function SharingTab() {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const { data: shares, isLoading } = useShares(activeCanvasId ?? undefined);

  if (isLoading) {
    return (
      <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
        Loading...
      </Typography>
    );
  }

  if (!shares?.length) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", py: 2 }}>
        <LinkOffIcon sx={{ fontSize: 32, color: "var(--color-overlay0)" }} />
        <Typography variant="body2" sx={{ color: "var(--color-subtext0)", textAlign: "center" }}>
          No active share links. Use the share button in the top bar or item menu to create one.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
        Active Share Links
      </Typography>
      {shares.map((share) => (
        <ShareRow key={share.id} share={share} />
      ))}
    </Box>
  );
}
