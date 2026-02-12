import Box from "@mui/material/Box";
import { useMemo, useState } from "react";
import { blurhashToDataURL } from "../utils/blurhashToDataURL";

interface BlurImageProps {
  src: string;
  alt: string;
  blurhash?: string;
  sx?: Record<string, unknown>;
}

export default function BlurImage({ src, alt, blurhash, sx }: BlurImageProps) {
  const [loaded, setLoaded] = useState(false);
  const blurDataURL = useMemo(() => blurhashToDataURL(blurhash), [blurhash]);

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
          objectFit: "cover",
          display: "block",
        }}
      />
    </Box>
  );
}
