import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import FeedbackForm from "../sharedComponents/FeedbackForm";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
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
            A wild bug appeared!
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--color-subtext0)" }}>
            Something broke, but every adventure has its setbacks.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Box sx={{ width: "100%", maxWidth: 400, mt: 4 }}>
            <FeedbackForm />
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
