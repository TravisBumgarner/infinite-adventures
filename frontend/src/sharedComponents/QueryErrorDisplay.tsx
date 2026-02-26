import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface QueryErrorDisplayProps {
  error: Error | null;
  onRetry: () => void;
}

export default function QueryErrorDisplay({ error, onRetry }: QueryErrorDisplayProps) {
  if (!error) return null;
  // Stub — to be implemented
  return (
    <Box>
      <Typography>Something went wrong</Typography>
      <Button onClick={onRetry}>Try again</Button>
    </Box>
  );
}
