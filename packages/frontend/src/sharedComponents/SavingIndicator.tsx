import SyncIcon from "@mui/icons-material/Sync";
import { keyframes } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useSavingStore } from "../hooks/useAutoSave";

const spin = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
`;

export default function SavingIndicator() {
  const isSaving = useSavingStore((s) => s.isSaving);
  if (!isSaving) return null;

  return (
    <Tooltip title="Saving...">
      <SyncIcon
        sx={{
          fontSize: 20,
          color: "var(--color-subtext0)",
          animation: `${spin} 1s linear infinite`,
          display: "flex",
          alignSelf: "center",
          mr: 1,
        }}
      />
    </Tooltip>
  );
}
