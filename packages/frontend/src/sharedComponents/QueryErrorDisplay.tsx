import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface QueryErrorDisplayProps {
  error: Error | null;
  onRetry: () => void;
}

export default function QueryErrorDisplay({ error, onRetry }: QueryErrorDisplayProps) {
  if (!error) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        gap: 2,
        color: "var(--color-subtext0)",
      }}
    >
      <Typography variant="body1">Something went wrong</Typography>
      <Button variant="outlined" size="small" onClick={onRetry}>
        Try again
      </Button>
    </Box>
  );
}
