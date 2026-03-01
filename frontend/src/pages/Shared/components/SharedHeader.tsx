import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { copySharedContent } from "../../../api/shares";
import { STORAGE_KEY_POST_AUTH_REDIRECT, STORAGE_KEY_SHARED_COPY_PROMPT } from "../../../constants";
import { useAppStore } from "../../../stores/appStore";

interface SharedHeaderProps {
  canvasName: string;
  shareType: "canvas" | "item";
  token: string;
}

export default function SharedHeader({ canvasName, shareType, token }: SharedHeaderProps) {
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
    localStorage.setItem(STORAGE_KEY_SHARED_COPY_PROMPT, "1");
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
