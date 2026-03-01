import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { CanvasItem, SharedContent } from "shared";
import { copySharedContent, fetchSharedContent } from "../../api/shares";
import { CANVAS_ITEM_TYPES, STORAGE_KEY_POST_AUTH_REDIRECT } from "../../constants";
import BlurImage from "../../sharedComponents/BlurImage";
import { canvasItemTypeIcon, LabelBadge } from "../../sharedComponents/LabelBadge";
import { useAppStore } from "../../stores/appStore";
import { FONT_SIZES } from "../../styles/styleConsts";

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stripToPlainText(content: string, itemsMap: Map<string, string>): string {
  return content
    .replace(/<[^>]*>/g, "")
    .replace(/@\{([^}]+)\}/g, (_match, id) => {
      const title = itemsMap.get(id);
      return title ? `@${title}` : "";
    })
    .trim();
}

// ─── Header ──────────────────────────────────────────────────────────────────

function SharedHeader({
  canvasName,
  shareType,
  token,
}: {
  canvasName: string;
  shareType: "canvas" | "item";
  token: string;
}) {
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    try {
      const result = await copySharedContent(token);
      showToast("Copied to your workspace!");
      navigate(`/canvas?canvasId=${result.id}`);
    } catch {
      showToast("Failed to copy");
    } finally {
      setCopying(false);
    }
  };

  const storeRedirectAndNavigate = (path: string) => {
    localStorage.setItem(STORAGE_KEY_POST_AUTH_REDIRECT, `/shared/${token}`);
    navigate(path);
  };

  return (
    <Box
      component="header"
      sx={{
        py: 1.5,
        px: 3,
        borderBottom: "1px solid var(--color-surface1)",
        position: "sticky",
        top: 0,
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--color-text)" }}>
              Infinite Adventures
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--color-overlay0)", display: { xs: "none", sm: "block" } }}
            >
              Shared {shareType === "canvas" ? "Canvas" : "Item"} · {canvasName}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {user ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                disabled={copying}
              >
                {copying ? "Copying…" : "Copy to My Workspace"}
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => storeRedirectAndNavigate("/login")}
                  sx={{ color: "var(--color-subtext0)" }}
                >
                  Log in
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => storeRedirectAndNavigate("/signup")}
                >
                  Sign up free
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

// ─── Sticky CTA bar (unauthenticated only) ───────────────────────────────────

function StickyCtaBar({ token }: { token: string }) {
  const user = useAppStore((s) => s.user);
  const navigate = useNavigate();

  if (user) return null;

  const storeRedirectAndNavigate = (path: string) => {
    localStorage.setItem(STORAGE_KEY_POST_AUTH_REDIRECT, `/shared/${token}`);
    navigate(path);
  };

  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: 100,
        borderTop: "1px solid var(--color-surface1)",
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        py: 2,
        px: 3,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <ContentCopyIcon sx={{ color: "var(--color-mauve)", fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Build your own world
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--color-subtext0)" }}>
                Track characters, places, events, and sessions — all in one canvas.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} flexShrink={0}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => storeRedirectAndNavigate("/login")}
            >
              Log in
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => storeRedirectAndNavigate("/signup")}
            >
              Sign up free
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

// ─── Notes ───────────────────────────────────────────────────────────────────

function ItemNotes({ item, itemsMap }: { item: CanvasItem; itemsMap: Map<string, string> }) {
  if (!item.notes.length) return null;
  return (
    <Stack spacing={1.5}>
      {item.notes.map((note) => (
        <Box
          key={note.id}
          sx={{
            bgcolor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            mb={note.title ? 0.5 : 0}
          >
            {note.title && (
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {note.title}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: "var(--color-overlay0)", ml: "auto" }}>
              {formatDate(note.updatedAt)}
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: "var(--color-subtext0)",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {stripToPlainText(note.content, itemsMap)}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

// ─── Photos ──────────────────────────────────────────────────────────────────

function ItemPhotos({ item }: { item: CanvasItem }) {
  const nonMain = item.photos.filter((p) => !p.isMainPhoto);
  if (!nonMain.length) return null;
  return (
    <Box sx={{ columnCount: { xs: 2, sm: 3 }, columnGap: 1 }}>
      {nonMain.map((photo) => (
        <Box
          key={photo.id}
          sx={{
            breakInside: "avoid",
            mb: 1,
            borderRadius: 1,
            overflow: "hidden",
            bgcolor: "var(--color-surface0)",
            aspectRatio: photo.aspectRatio ? `${photo.aspectRatio}` : "1",
          }}
        >
          <BlurImage
            src={photo.url}
            alt={photo.caption ?? ""}
            blurhash={photo.blurhash}
            aspectRatio={photo.aspectRatio}
            sx={{ width: "100%", height: "100%" }}
          />
        </Box>
      ))}
    </Box>
  );
}

// ─── Single item card ─────────────────────────────────────────────────────────

function ItemCard({ item, itemsMap }: { item: CanvasItem; itemsMap: Map<string, string> }) {
  const typeInfo = CANVAS_ITEM_TYPES.find((t) => t.value === item.type);

  return (
    <Card
      sx={{
        bgcolor: "var(--color-surface0)",
        border: "1px solid var(--color-surface1)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {item.title || "Untitled"}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {typeInfo && (
                <LabelBadge
                  label={typeInfo.label}
                  accentColor="var(--color-surface1)"
                  icon={canvasItemTypeIcon(item.type)}
                  height={20}
                  fontSize={FONT_SIZES.xs}
                />
              )}
            </Stack>
            {item.summary && (
              <Typography variant="body2" sx={{ color: "var(--color-subtext0)", mt: 1 }}>
                {item.summary}
              </Typography>
            )}
          </Box>
          <ItemNotes item={item} itemsMap={itemsMap} />
          <ItemPhotos item={item} />
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Canvas share view ────────────────────────────────────────────────────────

function SharedCanvasView({
  content,
}: {
  content: Extract<SharedContent, { shareType: "canvas" }>;
}) {
  const itemsMap = new Map(content.items.map((i) => [i.id, i.title]));

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
          {content.items.map((item) => (
            <ItemCard key={item.id} item={item} itemsMap={itemsMap} />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

// ─── Single-item share view ───────────────────────────────────────────────────

function SharedItemView({ item, allItems }: { item: CanvasItem; allItems: CanvasItem[] }) {
  const itemsMap = new Map(allItems.map((i) => [i.id, i.title]));
  const mainPhoto = item.photos.find((p) => p.isMainPhoto);
  const typeInfo = CANVAS_ITEM_TYPES.find((t) => t.value === item.type);

  return (
    <Box sx={{ py: { xs: 3, md: 4 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {mainPhoto && (
              <Box
                sx={{ width: 80, height: 80, flexShrink: 0, borderRadius: 1, overflow: "hidden" }}
              >
                <BlurImage
                  src={mainPhoto.url}
                  alt={item.title}
                  blurhash={mainPhoto.blurhash}
                  cropX={mainPhoto.cropX}
                  cropY={mainPhoto.cropY}
                  aspectRatio={mainPhoto.aspectRatio}
                  sx={{ width: "100%", height: "100%" }}
                />
              </Box>
            )}
            <Box>
              {typeInfo && (
                <LabelBadge
                  label={typeInfo.label}
                  accentColor="var(--color-surface1)"
                  icon={canvasItemTypeIcon(item.type)}
                  height={20}
                  fontSize={FONT_SIZES.xs}
                />
              )}
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {item.title || "Untitled"}
              </Typography>
              {item.summary && (
                <Typography variant="body2" sx={{ color: "var(--color-subtext0)", mt: 0.5 }}>
                  {item.summary}
                </Typography>
              )}
            </Box>
          </Stack>
          <ItemNotes item={item} itemsMap={itemsMap} />
          <ItemPhotos item={item} />
        </Stack>
      </Container>
    </Box>
  );
}

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
    </Box>
  );
}
