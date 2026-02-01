import { useCallback, useEffect, useState } from "react";
import { SIDEBAR_WIDTH } from "../../../constants";
import type { ThemePreference } from "../../../styles/styleConsts";
import { useThemePreference } from "../../../styles/Theme";

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button type="button" style={styles.gearButton} onClick={onClick} title="Settings">
      &#9881;
    </button>
  );
}

interface SettingsSidebarProps {
  onClose: () => void;
  onToast: (message: string) => void;
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const DISCORD_URL = "https://discord.com/invite/J8jwMxEEff";
const CONTACT_FORM_URL = "https://contact-form.nfshost.com/contact";
const MAX_CHARS = 800;

export function SettingsSidebar({ onClose, onToast }: SettingsSidebarProps) {
  const { preference, setPreference } = useThemePreference();
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > MAX_CHARS) return;
    setFeedbackMessage(e.target.value);
  }, []);

  const handleSubmitFeedback = async () => {
    const trimmed = feedbackMessage.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const response = await fetch(CONTACT_FORM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, website: "infinite-adventures-feedback" }),
      });
      if (response.ok) {
        setFeedbackMessage("");
        onToast("Feedback sent — thank you!");
      } else {
        onToast("Failed to send feedback");
      }
    } catch {
      onToast("Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <h3 style={styles.title}>Settings</h3>
        <button type="button" onClick={onClose} style={styles.closeBtn}>
          &times;
        </button>
      </div>

      {/* Theme */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Theme</div>
        <div style={styles.options}>
          {THEME_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              style={{
                ...styles.optionCard,
                borderColor:
                  preference === opt.value ? "var(--color-blue)" : "var(--color-surface1)",
              }}
              onClick={() => setPreference(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Feedback</div>
        <div style={styles.charCount}>
          {feedbackMessage.length}/{MAX_CHARS} characters
        </div>
        <textarea
          style={styles.textarea}
          placeholder="Tell us what you think..."
          value={feedbackMessage}
          onChange={handleMessageChange}
          rows={4}
        />
        <button
          type="button"
          style={{
            ...styles.submitBtn,
            opacity: submitting || !feedbackMessage.trim() ? 0.5 : 1,
          }}
          onClick={handleSubmitFeedback}
          disabled={submitting || !feedbackMessage.trim()}
        >
          {submitting ? "Sending..." : "Send Feedback"}
        </button>
      </div>

      {/* Discord */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Community</div>
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
          Join us on Discord
        </a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  gearButton: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 50,
    background: "var(--color-base)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 8,
    color: "var(--color-text)",
    fontSize: 20,
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: "100vh",
    background: "var(--color-base)",
    borderRight: "1px solid var(--color-surface1)",
    zIndex: 200,
    padding: 20,
    overflowY: "auto",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: "var(--color-text)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--color-text)",
    fontSize: 24,
    cursor: "pointer",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    color: "var(--color-subtext0)",
    fontWeight: 600,
  },
  charCount: {
    fontSize: 12,
    color: "var(--color-overlay0)",
    textAlign: "right",
  },
  options: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },
  optionCard: {
    flex: 1,
    padding: "8px 0",
    background: "var(--color-surface0)",
    border: "2px solid",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "system-ui, sans-serif",
  },
  textarea: {
    background: "var(--color-surface0)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 8,
    color: "var(--color-text)",
    fontSize: 14,
    padding: "10px 12px",
    resize: "vertical",
    fontFamily: "system-ui, sans-serif",
    outline: "none",
  },
  submitBtn: {
    background: "var(--color-blue)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
  },
  linkBtn: {
    display: "block",
    padding: "10px 14px",
    background: "var(--color-surface0)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 8,
    color: "var(--color-blue)",
    fontSize: 14,
    textDecoration: "none",
    textAlign: "center",
    fontWeight: 600,
    fontFamily: "system-ui, sans-serif",
  },
};
