import { useEffect } from "react";
import { useThemePreference } from "../styles/Theme";
import type { ThemePreference } from "../styles/styleConsts";

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button style={styles.gearButton} onClick={onClick} title="Settings">
      &#9881;
    </button>
  );
}

interface SettingsModalProps {
  onClose: () => void;
}

const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: "system", label: "System", description: "Follow your OS preference" },
  { value: "light", label: "Light", description: "Catppuccin Latte" },
  { value: "dark", label: "Dark", description: "Catppuccin Mocha" },
];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { preference, setPreference } = useThemePreference();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Settings</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            &times;
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Theme</div>
          <div style={styles.options}>
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...styles.optionCard,
                  borderColor:
                    preference === opt.value
                      ? "var(--color-blue)"
                      : "var(--color-surface1)",
                }}
                onClick={() => setPreference(opt.value)}
              >
                <div style={styles.optionLabel}>{opt.label}</div>
                <div style={styles.optionDesc}>{opt.description}</div>
              </button>
            ))}
          </div>
        </div>
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
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 250,
    background: "var(--color-backdrop)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "var(--color-base)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 12,
    padding: 24,
    width: 360,
    maxWidth: "90vw",
    boxShadow: "0 16px 48px var(--color-backdrop)",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  options: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  optionCard: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "10px 14px",
    background: "var(--color-surface0)",
    border: "2px solid",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "system-ui, sans-serif",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--color-text)",
  },
  optionDesc: {
    fontSize: 12,
    color: "var(--color-subtext0)",
  },
};
