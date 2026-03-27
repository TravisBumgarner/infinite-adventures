import { Alert, Box, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../auth/service.js";
import { STORAGE_KEY_POST_AUTH_REDIRECT } from "../../constants";
import Turnstile from "../../sharedComponents/Turnstile";
import { useAppStore } from "../../stores/appStore";

export default function Login() {
  const navigate = useNavigate();
  const refreshUser = useAppStore((s) => s.refreshUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the verification");
      return;
    }
    setError("");
    setSubmitting(true);

    const result = await login({ email, password });
    if (result.success) {
      await refreshUser();
      const redirect = localStorage.getItem(STORAGE_KEY_POST_AUTH_REDIRECT);
      if (redirect && !redirect.startsWith("/shared/")) {
        localStorage.removeItem(STORAGE_KEY_POST_AUTH_REDIRECT);
      }
      navigate(redirect ?? "/");
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 8,
        px: 2,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Log in
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Box sx={{ my: 2 }}>
          <Turnstile onToken={setTurnstileToken} />
        </Box>
        <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ mt: 2 }}>
          {submitting ? "Logging in..." : "Log in"}
        </Button>
      </Box>

      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        <MuiLink component={Link} to="/signup">
          Don't have an account? Sign up
        </MuiLink>
        <MuiLink component={Link} to="/password-reset">
          Forgot password?
        </MuiLink>
      </Box>
    </Box>
  );
}
