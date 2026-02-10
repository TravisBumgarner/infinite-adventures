import { decode } from "blurhash";
import { useEffect, useRef } from "react";

interface BlurhashCanvasProps {
  blurhash: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
}

export default function BlurhashCanvas({ blurhash, width, height, style }: BlurhashCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const pixels = decode(blurhash, width, height);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    } catch {
      // Invalid blurhash — leave canvas blank
    }
  }, [blurhash, width, height]);

  return <canvas ref={canvasRef} style={{ display: "block", ...style }} />;
}
