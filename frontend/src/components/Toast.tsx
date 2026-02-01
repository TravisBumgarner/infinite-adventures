import { useEffect } from "react";

interface ToastProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

export default function Toast({ message, onDone, duration = 2000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [onDone, duration]);

  return <div style={styles.toast}>{message}</div>;
}

const styles: Record<string, React.CSSProperties> = {
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#313244",
    color: "#cdd6f4",
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "system-ui, sans-serif",
    zIndex: 300,
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
};
