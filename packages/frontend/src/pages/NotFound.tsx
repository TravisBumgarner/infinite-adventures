import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import FeedbackForm from "../sharedComponents/FeedbackForm";

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "var(--color-base)",
        color: "var(--color-text)",
        p: 4,
        gap: 3,
      }}
    >
      <Typography variant="h3" component="h1">
        You've wandered off the map
      </Typography>
      <Typography variant="body1" sx={{ color: "var(--color-subtext0)" }}>
        This path doesn't lead anywhere — yet.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Return to Camp
      </Button>
      <Box sx={{ width: "100%", maxWidth: 400, mt: 4 }}>
        <FeedbackForm />
      </Box>
    </Box>
  );
}
