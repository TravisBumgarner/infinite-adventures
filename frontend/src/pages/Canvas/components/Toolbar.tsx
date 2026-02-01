import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import type { NoteType } from "shared";
import { NOTE_TYPES, TYPE_LABELS } from "../../../constants";

interface ToolbarProps {
  onCreate: (type: NoteType) => void;
}

export default function Toolbar({ onCreate }: ToolbarProps) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 0.5,
        p: "6px 8px",
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--color-surface1)",
        borderRadius: 3,
        zIndex: 50,
      }}
    >
      {NOTE_TYPES.map((t) => (
        <Button
          key={t.value}
          size="small"
          onClick={() => onCreate(t.value)}
          title={`New ${TYPE_LABELS[t.value]}`}
          sx={{
            color: "var(--color-text)",
            fontSize: 13,
            textTransform: "none",
            whiteSpace: "nowrap",
            gap: 0.75,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "3px",
              flexShrink: 0,
              bgcolor: theme.palette.nodeTypes[t.value].light,
            }}
          />
          {TYPE_LABELS[t.value]}
        </Button>
      ))}
    </Box>
  );
}
