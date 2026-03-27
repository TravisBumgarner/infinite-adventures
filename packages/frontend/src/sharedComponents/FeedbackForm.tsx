import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useState } from "react";
import { useAppStore } from "../stores/appStore";

const CONTACT_FORM_URL = "https://contact-form.nfshost.com/contact";
const MAX_CHARS = 800;

export default function FeedbackForm() {
  const showToast = useAppStore((s) => s.showToast);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.target.value.length > MAX_CHARS) return;
      setFeedbackMessage(e.target.value);
    },
    [],
  );

  const handleSubmitFeedback = async () => {
    const trimmed = feedbackMessage.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const response = await fetch(CONTACT_FORM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          website: "infinite-adventures-feedback",
        }),
      });
      if (response.ok) {
        setFeedbackMessage("");
        showToast("Feedback sent — thank you!");
      } else {
        showToast("Failed to send feedback");
      }
    } catch {
      showToast("Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "var(--color-subtext0)", fontWeight: 600 }}>
        Feedback
      </Typography>
      <Typography variant="caption" sx={{ color: "var(--color-overlay0)", textAlign: "right" }}>
        {feedbackMessage.length}/{MAX_CHARS} characters
      </Typography>
      <TextField
        multiline
        rows={4}
        placeholder="Tell us what you think..."
        value={feedbackMessage}
        onChange={handleMessageChange}
        size="small"
        fullWidth
      />
      <Button
        variant="contained"
        onClick={handleSubmitFeedback}
        disabled={submitting || !feedbackMessage.trim()}
      >
        {submitting ? "Sending..." : "Send Feedback"}
      </Button>
    </Box>
  );
}
