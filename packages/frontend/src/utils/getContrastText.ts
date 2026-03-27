/**
 * Returns "#fff" or "#000" based on the WCAG relative luminance
 * of the given hex background color.
 */
export function getContrastText(backgroundColor: string): "#fff" | "#000" {
  const hex = backgroundColor.replace("#", "");
  const expanded =
    hex.length === 3 ? hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]! : hex;

  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;

  // sRGB to linear
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.179 ? "#000" : "#fff";
}
