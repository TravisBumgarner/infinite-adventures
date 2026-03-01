import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { CanvasItem, SharedContent } from "shared";
import { copySharedContent, fetchSharedContent } from "../../api/shares";
import { STORAGE_KEY_SHARED_COPY_PROMPT } from "../../constants";
import { useAppStore } from "../../stores/appStore";
import { ItemCard, SharedItemView } from "./components/ItemCard";
import SharedHeader from "./components/SharedHeader";
import StickyCtaBar from "./components/StickyCtaBar";

// ─── Footer ───────────────────────────────────────────────────────────────────

function SharedFooter() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 3,
        borderTop: "1px solid var(--color-surface1)",
        bgcolor: "var(--color-mantle)",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Typography variant="body2" sx={{ color: "var(--color-overlay0)" }}>
            Infinite Adventures — Built for storytellers everywhere
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              component="a"
              href="https://discord.com/invite/J8jwMxEEff"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: "var(--color-subtext0)" }}
            >
              Discord
            </Button>
            <Button
              component={Link}
              to="/release-notes"
              size="small"
              sx={{ color: "var(--color-subtext0)" }}
            >
              Release Notes
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

// ─── Canvas share view ────────────────────────────────────────────────────────

function SharedCanvasView({
  content,
}: {
  content: Extract<SharedContent, { shareType: "canvas" }>;
}) {
  const itemsMap = new Map(content.items.map((i: CanvasItem) => [i.id, i.title]));

  return (
    <Box sx={{ py: { xs: 3, md: 4 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {content.canvasName}
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
              {content.items.length} item{content.items.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
          {content.items.map((item: CanvasItem) => (
            <ItemCard key={item.id} item={item} itemsMap={itemsMap} />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

// ─── Copy prompt after login ──────────────────────────────────────────────────

function CopyPromptDialog({
  token,
  canvasName,
  shareType,
}: {
  token: string;
  canvasName: string;
  shareType: "canvas" | "item";
}) {
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (user && localStorage.getItem(STORAGE_KEY_SHARED_COPY_PROMPT)) {
      localStorage.removeItem(STORAGE_KEY_SHARED_COPY_PROMPT);
      setOpen(true);
    }
  }, [user]);

  const handleCopy = async () => {
    setCopying(true);
    try {
      const result = await copySharedContent(token);
      showToast("Copied to your workspace!");
      navigate(`/canvas?canvasId=${result.id}`);
    } catch {
      showToast("Failed to copy");
      setOpen(false);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Copy to Your Workspace</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
          Would you like to copy this shared {shareType === "canvas" ? "canvas" : "item"} (
          {canvasName}) to your workspace?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} disabled={copying}>
          No thanks
        </Button>
        <Button
          variant="contained"
          onClick={handleCopy}
          disabled={copying}
          startIcon={<ContentCopyIcon />}
        >
          {copying ? "Copying…" : "Copy"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function SharedViewer() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared", token],
    queryFn: () => fetchSharedContent(token!),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
          bgcolor: "var(--color-base)",
        }}
      >
        <LinkOffIcon sx={{ fontSize: 48, color: "var(--color-overlay0)" }} />
        <Typography variant="h6">This shared link is no longer available</Typography>
        <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
          The link may have been revoked or the content may have been deleted.
        </Typography>
        <Button variant="outlined" component={Link} to="/">
          Go to Infinite Adventures
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "auto",
        bgcolor: "var(--color-base)",
        color: "var(--color-text)",
      }}
    >
      <SharedHeader canvasName={data.canvasName} shareType={data.shareType} token={token!} />

      {data.shareType === "canvas" ? (
        <SharedCanvasView content={data} />
      ) : (
        <SharedItemView item={data.item} allItems={data.allItems} />
      )}
      <SharedFooter />

      <StickyCtaBar token={token!} />
      <CopyPromptDialog token={token!} canvasName={data.canvasName} shareType={data.shareType} />
    </Box>
  );
}
