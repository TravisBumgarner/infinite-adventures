import Box from "@mui/material/Box";
import { useMemo, useState } from "react";
import { blurhashToDataURL } from "../utils/blurhashToDataURL";

interface BlurImageProps {
  src: string;
  alt: string;
  blurhash?: string;
  objectFit?: "cover" | "contain";
  cropX?: number;
  cropY?: number;
  aspectRatio?: number;
  sx?: Record<string, unknown>;
}

/**
 * Convert a focal-point percentage (0–100, relative to the image) into the
 * CSS `object-position` percentage that actually centers that point inside a
 * square container when `object-fit: cover` is active.
 *
 * CSS `object-position: P%` aligns the P% point of the *image* with the P%
 * point of the *container*, which is NOT the same as centering that point.
 * We invert the formula so the focal point lands at the container center.
 */
function focalToObjectPosition(cropX: number, cropY: number, ar: number): { x: number; y: number } {
  let x = cropX;
  let y = cropY;

  if (ar > 1) {
    // Landscape: width overflows, height fits → adjust X
    x = (50 - cropX * ar) / (1 - ar);
  } else if (ar < 1) {
    // Portrait: height overflows, width fits → adjust Y
    y = (50 * ar - cropY) / (ar - 1);
  }

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

export default function BlurImage({
  src,
  alt,
  blurhash,
  objectFit = "cover",
  cropX,
  cropY,
  aspectRatio,
  sx,
}: BlurImageProps) {
  const [loaded, setLoaded] = useState(false);
  const blurDataURL = useMemo(() => blurhashToDataURL(blurhash), [blurhash]);

  const objectPosition = useMemo(() => {
    if (cropX == null || cropY == null) return undefined;
    if (aspectRatio && objectFit === "cover") {
      const pos = focalToObjectPosition(cropX, cropY, aspectRatio);
      return `${pos.x}% ${pos.y}%`;
    }
    return `${cropX}% ${cropY}%`;
  }, [cropX, cropY, aspectRatio, objectFit]);

  return (
    <Box
      sx={{
        position: "relative",
        backgroundImage: blurDataURL && !loaded ? `url(${blurDataURL})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
        ...sx,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        sx={{
          width: "100%",
          height: "100%",
          objectFit,
          objectPosition,
          display: "block",
        }}
      />
    </Box>
  );
}
