import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEY_POST_AUTH_REDIRECT, STORAGE_KEY_SHARED_COPY_PROMPT } from "../../../constants";
import { useAppStore } from "../../../stores/appStore";

interface StickyCtaBarProps {
  token: string;
}

export default function StickyCtaBar({ token }: StickyCtaBarProps) {
  const user = useAppStore((s) => s.user);
  const navigate = useNavigate();

  if (user) return null;

  const storeRedirectAndNavigate = (path: string) => {
    localStorage.setItem(STORAGE_KEY_POST_AUTH_REDIRECT, `/shared/${token}`);
    localStorage.setItem(STORAGE_KEY_SHARED_COPY_PROMPT, "1");
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
          <Button
            variant="contained"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={() => storeRedirectAndNavigate("/signup")}
          >
            Save Canvas
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
