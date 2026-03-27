import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useRef, useState } from "react";
import { exportCanvas } from "../../api/index";
import { useImportCanvas } from "../../hooks/mutations";
import { useAppStore } from "../../stores/appStore";
import { useCanvasStore } from "../../stores/canvasStore";

export default function DataTab() {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const canvases = useCanvasStore((s) => s.canvases);
  const showToast = useAppStore((s) => s.showToast);
  const [exporting, setExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportCanvas();

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

  const handleExport = async () => {
    if (!activeCanvasId) return;
    setExporting(true);
    try {
      const blob = await exportCanvas(activeCanvasId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeCanvas?.name ?? "canvas"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Canvas exported");
    } catch {
      showToast("Failed to export canvas");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importMutation.mutate(file, {
      onSuccess: () => {
        showToast("Canvas imported successfully");
      },
    });
    e.target.value = "";
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleExport}
        disabled={exporting || !activeCanvasId}
      >
        {exporting ? "Backing up..." : "Backup Canvas"}
      </Button>
      <Button
        variant="outlined"
        startIcon={<UploadIcon />}
        onClick={() => importInputRef.current?.click()}
        disabled={importMutation.isPending}
      >
        {importMutation.isPending ? "Importing..." : "Import Canvas"}
      </Button>
      <input ref={importInputRef} type="file" accept=".zip" hidden onChange={handleImport} />
    </Box>
  );
}
