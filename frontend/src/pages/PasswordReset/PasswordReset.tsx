import { Alert, Box, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword, updatePassword } from "../../auth/service.js";
import { useAppStore } from "../../stores/appStore";

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await resetPassword(email, `${window.location.origin}/password-reset`);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <>
        <Typography>Check your email for a password reset link.</Typography>
        <Box sx={{ mt: 2 }}>
          <MuiLink component={Link} to="/login">
            Back to login
          </MuiLink>
        </Box>
      </>
    );
  }

  return (
    <>
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
        <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ mt: 2 }}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        <MuiLink component={Link} to="/login">
          Back to login
        </MuiLink>
      </Box>
    </>
  );
}

function UpdatePasswordForm() {
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
    const result = await updatePassword(password);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  }

  if (success) {
    return <Alert severity="success">Password updated successfully.</Alert>;
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="New password"
          type="password"
          fullWidth
          required
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <TextField
          label="Confirm new password"
          type="password"
          fullWidth
          required
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ mt: 2 }}>
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </Box>
    </>
  );
}

export default function PasswordReset() {
  const user = useAppStore((s) => s.user);

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
        {user ? "Update password" : "Reset password"}
      </Typography>

      {user ? <UpdatePasswordForm /> : <RequestResetForm />}
    </Box>
  );
}
