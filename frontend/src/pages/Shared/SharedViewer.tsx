import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CanvasItem, SharedContent } from "shared";
import { copySharedContent, fetchSharedContent } from "../../api/shares";
import { CANVAS_ITEM_TYPES, STORAGE_KEY_POST_AUTH_REDIRECT } from "../../constants";
import BlurImage from "../../sharedComponents/BlurImage";
import { canvasItemTypeIcon, LabelBadge } from "../../sharedComponents/LabelBadge";
import { useAppStore } from "../../stores/appStore";
import { FONT_SIZES } from "../../styles/styleConsts";
import { getNotePreview } from "../../utils/getNotePreview";

function SharedHeader({
  canvasName,
  shareType,
}: {
  canvasName: string;
  shareType: "canvas" | "item";
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderBottom: "1px solid var(--color-surface1)",
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Infinite Adventures
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
        Shared {shareType === "canvas" ? "Canvas" : "Item"} from "{canvasName}"
      </Typography>
    </Box>
  );
}

function CopySection({ token }: { token: string }) {
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

  if (user) {
    return (
      <Button
        variant="contained"
        startIcon={<ContentCopyIcon />}
        onClick={handleCopy}
        disabled={copying}
        sx={{ alignSelf: "flex-start" }}
      >
        {copying ? "Copying..." : "Copy to My Workspace"}
      </Button>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "var(--color-surface0)",
        borderRadius: 2,
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        textAlign: "center",
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Want to add this to your own workspace?
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--color-subtext0)", maxWidth: 400 }}>
        Sign up for Infinite Adventures to copy this content and start building your own world.
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
        <Button variant="contained" onClick={() => storeRedirectAndNavigate("/signup")}>
          Sign Up
        </Button>
        <Button variant="outlined" onClick={() => storeRedirectAndNavigate("/login")}>
          Log In
        </Button>
      </Box>
    </Box>
  );
}

function ItemNotes({ item }: { item: CanvasItem }) {
  if (!item.notes.length) return null;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {item.notes.map((note) => (
        <Box
          key={note.id}
          sx={{
            bgcolor: "var(--color-surface0)",
            borderRadius: 1,
            p: 1.5,
          }}
        >
          {note.title && (
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {note.title}
            </Typography>
          )}
          <Typography
            variant="body2"
            sx={{
              color: "var(--color-subtext0)",
              wordBreak: "break-word",
              "& a": { color: "var(--color-blue)" },
            }}
            dangerouslySetInnerHTML={{ __html: getNotePreview(note.content, undefined, 0) }}
          />
        </Box>
      ))}
    </Box>
  );
}

function ItemPhotos({ item }: { item: CanvasItem }) {
  if (!item.photos.length) return null;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 1,
      }}
    >
      {item.photos.map((photo) => (
        <Box
          key={photo.id}
          sx={{
            borderRadius: 1,
            overflow: "hidden",
            aspectRatio: "1",
            bgcolor: "var(--color-surface0)",
          }}
        >
          <BlurImage
            src={photo.url}
            alt={photo.caption ?? ""}
            blurhash={photo.blurhash}
            cropX={photo.cropX}
            cropY={photo.cropY}
            aspectRatio={photo.aspectRatio}
            sx={{ width: "100%", height: "100%" }}
          />
        </Box>
      ))}
    </Box>
  );
}

function ItemSection({ item }: { item: CanvasItem }) {
  const typeInfo = CANVAS_ITEM_TYPES.find((t) => t.value === item.type);
  const mainPhoto = item.photos.find((p) => p.isMainPhoto);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        {mainPhoto && (
          <Box
            sx={{
              width: 80,
              height: 80,
              flexShrink: 0,
              borderRadius: 1,
              overflow: "hidden",
            }}
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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {item.title || "Untitled"}
          </Typography>
          {typeInfo && (
            <LabelBadge
              label={typeInfo.label}
              accentColor="var(--color-surface1)"
              icon={canvasItemTypeIcon(item.type)}
              height={20}
              fontSize={FONT_SIZES.xs}
            />
          )}
          {item.summary && (
            <Typography variant="body2" sx={{ color: "var(--color-subtext0)", mt: 0.5 }}>
              {item.summary}
            </Typography>
          )}
        </Box>
      </Box>
      <ItemNotes item={item} />
      <ItemPhotos item={item} />
    </Box>
  );
}

function SharedItemView({ item, token }: { item: CanvasItem; token: string }) {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <ItemSection item={item} />
      <CopySection token={token} />
    </Box>
  );
}

function SharedCanvasView({
  content,
  token,
}: {
  content: Extract<SharedContent, { shareType: "canvas" }>;
  token: string;
}) {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {content.canvasName}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
          {content.items.length} item{content.items.length !== 1 ? "s" : ""}
        </Typography>
      </Box>
      {content.items.map((item, i) => (
        <Box key={item.id}>
          {i > 0 && <Divider sx={{ mb: 3 }} />}
          <ItemSection item={item} />
        </Box>
      ))}
      <CopySection token={token} />
    </Box>
  );
}

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
        }}
      >
        <LinkOffIcon sx={{ fontSize: 48, color: "var(--color-overlay0)" }} />
        <Typography variant="h6">This shared link is no longer available</Typography>
        <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
          The link may have been revoked or the content may have been deleted.
        </Typography>
        <Button variant="outlined" component="a" href="/">
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
      <SharedHeader canvasName={data.canvasName} shareType={data.shareType} />
      {data.shareType === "canvas" ? (
        <SharedCanvasView content={data} token={token!} />
      ) : (
        <SharedItemView item={data.item} token={token!} />
      )}
    </Box>
  );
}
