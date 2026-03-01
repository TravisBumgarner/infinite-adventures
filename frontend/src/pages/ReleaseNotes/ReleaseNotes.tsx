import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

interface ReleaseEntry {
  date: string;
  added?: string[];
  improved?: string[];
  fixed?: string[];
}

const releases: ReleaseEntry[] = [
  {
    date: "2026-02-28",
    added: [
      "Photo crop / focal point — choose where square thumbnails focus when setting a main photo",
      "Crop modal with draggable frame on set-as-main-photo (canvas panel & session detail)",
      "Lightbox action buttons (set main, pin/unpin, delete) available everywhere",
      "Gallery full-screen photo detail page (/gallery/:id)",
      "Info sidebar on session detail page",
    ],
    improved: [
      "Floating bottom bar in lightbox and gallery detail (600px max, rounded, blurred backdrop)",
      "Tag management: plus-button opens a checklist popover instead of inline autocomplete",
      "Square cropped thumbnails on sessions list, canvas nodes, and sidebar panel",
      "Tool sidebar moved to bottom-left of canvas",
    ],
  },
  {
    date: "2026-02-27",
    added: ["Flexible mention type selection (all item types)"],
    improved: [
      "Session card consistency",
      "Mention resolution in Timeline",
      "Initiative tracker UX (hide form when collapsed, disable empty submit, filter duplicates)",
    ],
    fixed: [
      "Photo tab crash (undefined handler)",
      "Photo delete confirmation missing",
      "Session preview not updating after photo changes",
      "Mention popup clipping off-screen",
    ],
  },
  {
    date: "2026-02-20",
    added: [
      "Canvas for organizing items",
      "Sessions for note-taking",
      "Timeline view",
      "Gallery view",
      "Photo management with blurhash previews",
      "@mentions linking items",
      "Import/Export",
    ],
  },
];

function SectionList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ color: "var(--color-subtext0)", mb: 0.5 }}>
        {title}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 3 }}>
        {items.map((item) => (
          <li key={item}>
            <Typography variant="body2" sx={{ color: "var(--color-text)" }}>
              {item}
            </Typography>
          </li>
        ))}
      </Box>
    </Box>
  );
}

export default function ReleaseNotes() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "var(--color-base)",
        py: 6,
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ color: "var(--color-text)", mb: 4, fontWeight: 700 }}>
          Release Notes
        </Typography>
        {releases.map((release) => (
          <Box
            key={release.date}
            sx={{
              mb: 4,
              pb: 4,
              borderBottom: "1px solid var(--color-surface1)",
            }}
          >
            <Typography variant="h6" sx={{ color: "var(--color-text)", mb: 2 }}>
              {release.date}
            </Typography>
            {release.added && <SectionList title="Added" items={release.added} />}
            {release.improved && <SectionList title="Improved" items={release.improved} />}
            {release.fixed && <SectionList title="Fixed" items={release.fixed} />}
          </Box>
        ))}
      </Container>
    </Box>
  );
}
