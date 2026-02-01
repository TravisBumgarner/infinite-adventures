import { Alert, Box, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { signup } from "../../auth/service.js";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    const result = await signup({ email, password });
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, px: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Check your email
        </Typography>
        <Typography>
          Check your email for a confirmation link to complete your registration.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <MuiLink component={Link} to="/login">
            Back to login
          </MuiLink>
        </Box>
      </Box>
    );
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
        Sign up
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
          autoComplete="new-password"
        />
        <TextField
          label="Confirm password"
          type="password"
          fullWidth
          required
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ mt: 2 }}>
          {submitting ? "Creating account…" : "Sign up"}
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        <MuiLink component={Link} to="/login">
          Already have an account? Log in
        </MuiLink>
      </Box>
    </Box>
  );
}
