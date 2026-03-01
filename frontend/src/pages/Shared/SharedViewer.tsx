import LinkOffIcon from "@mui/icons-material/LinkOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type { CanvasItem, SharedContent } from "shared";
import { fetchSharedContent } from "../../api/shares";
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
