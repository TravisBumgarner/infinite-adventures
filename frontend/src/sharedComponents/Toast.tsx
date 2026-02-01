import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ open, message, onClose, duration = 2000 }: ToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity="info" variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}
