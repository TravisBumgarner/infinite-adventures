import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { useCallback, useEffect, useRef, useState } from "react";
import { useModalStore } from "../store";
import type { CropPhotoModalProps } from "../types";
import BaseModal from "./BaseModal";

/** Frame size as a fraction of the image's shorter dimension. */
const FRAME_RATIO = 0.8;
const FRAME_MIN = 120;

export default function CropPhotoModal({
  photoUrl,
  aspectRatio: _aspectRatio,
  initialCropX,
  initialCropY,
  onConfirm,
}: CropPhotoModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [frameSize, setFrameSize] = useState(FRAME_MIN);
  const [framePos, setFramePos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Once the image loads, compute displayed size and initial frame position
  const handleImgLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const w = img.clientWidth;
      const h = img.clientHeight;
      setImgSize({ width: w, height: h });

      const size = Math.max(FRAME_MIN, Math.round(Math.min(w, h) * FRAME_RATIO));
      setFrameSize(size);

      // Place frame at initial crop position or center
      const cx = ((initialCropX ?? 50) / 100) * w;
      const cy = ((initialCropY ?? 50) / 100) * h;
      const half = size / 2;
      setFramePos({
        x: clamp(cx - half, 0, w - size),
        y: clamp(cy - half, 0, h - size),
      });
    },
    [initialCropX, initialCropY],
  );

  const clampFrame = useCallback(
    (x: number, y: number) => {
      if (!imgSize) return { x: 0, y: 0 };
      return {
        x: Math.round(clamp(x, 0, imgSize.width - frameSize)),
        y: Math.round(clamp(y, 0, imgSize.height - frameSize)),
      };
    },
    [imgSize, frameSize],
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !containerRef.current || !imgSize) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - containerRect.left - dragOffset.current.x;
      const y = e.clientY - containerRect.top - dragOffset.current.y;
      setFramePos(clampFrame(x, y));
    },
    [imgSize, clampFrame],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleConfirm = useCallback(() => {
    if (!framePos || !imgSize) return;
    const centerX = ((framePos.x + frameSize / 2) / imgSize.width) * 100;
    const centerY = ((framePos.y + frameSize / 2) / imgSize.height) * 100;
    onConfirm(Math.round(centerX * 100) / 100, Math.round(centerY * 100) / 100);
    closeModal();
  }, [framePos, frameSize, imgSize, onConfirm, closeModal]);

  // Allow Enter to confirm
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter") handleConfirm();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleConfirm]);

  return (
    <BaseModal title="Set Focal Point" maxWidth="md">
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        <Box
          ref={containerRef}
          sx={{
            position: "relative",
            display: "inline-block",
            lineHeight: 0,
            userSelect: "none",
            mx: "auto",
          }}
        >
          <Box
            component="img"
            src={photoUrl}
            onLoad={handleImgLoad}
            sx={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "70vh",
            }}
          />

          {/* Dimmed overlay */}
          {imgSize && framePos && (
            <>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                }}
              />
              {/* Clear crop window */}
              <Box
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                sx={{
                  position: "absolute",
                  left: framePos.x,
                  top: framePos.y,
                  width: frameSize,
                  height: frameSize,
                  outline: "2px solid white",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                  cursor: "move",
                  touchAction: "none",
                  bgcolor: "transparent",
                  backgroundImage: `url(${photoUrl})`,
                  backgroundSize: `${imgSize.width}px ${imgSize.height}px`,
                  backgroundPosition: `-${framePos.x}px -${framePos.y}px`,
                }}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={closeModal} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm} sx={{ textTransform: "none" }}>
          Confirm
        </Button>
      </DialogActions>
    </BaseModal>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
