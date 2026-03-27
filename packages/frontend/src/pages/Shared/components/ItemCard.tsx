import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CanvasItem } from "shared";
import BlurImage from "../../../sharedComponents/BlurImage";
import { CanvasItemTypeBadge } from "../../../sharedComponents/LabelBadge";

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

export function ItemCard({ item, itemsMap }: { item: CanvasItem; itemsMap: Map<string, string> }) {
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
              <CanvasItemTypeBadge type={item.type} accentColor="var(--color-surface1)" />
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

interface SharedItemViewProps {
  item: CanvasItem;
  allItems: CanvasItem[];
}

export function SharedItemView({ item, allItems }: SharedItemViewProps) {
  const itemsMap = new Map(allItems.map((i) => [i.id, i.title]));
  const mainPhoto = item.photos.find((p) => p.isMainPhoto);
  return (
    <Box sx={{ py: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {mainPhoto && (
            <Box sx={{ width: 80, height: 80, flexShrink: 0, borderRadius: 1, overflow: "hidden" }}>
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
            <CanvasItemTypeBadge type={item.type} accentColor="var(--color-surface1)" />
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
    </Box>
  );
}
