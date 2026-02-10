// Convert blurhash to a data:image/png URL without HTML Canvas.
// Adapted from https://gist.github.com/mattiaz9/53cb67040fa135cb395b1d015a200aff
import { decode } from "blurhash";

export function blurhashToDataURL(hash: string | undefined): string | undefined {
  if (!hash) return undefined;

  const pixels = decode(hash, 32, 32);
  const dataURL = parsePixels(pixels, 32, 32);
  return dataURL;
}

function parsePixels(pixels: Uint8ClampedArray, width: number, height: number) {
  const pixelsString = [...pixels].map((byte) => String.fromCharCode(byte)).join("");
  const pngString = generatePng(width, height, pixelsString);
  const dataURL =
    typeof Buffer !== "undefined"
      ? Buffer.from(getPngArray(pngString)).toString("base64")
      : btoa(pngString);
  return `data:image/png;base64,${dataURL}`;
}

function getPngArray(pngString: string) {
  const pngArray = new Uint8Array(pngString.length);
  for (let i = 0; i < pngString.length; i++) {
    pngArray[i] = pngString.charCodeAt(i);
  }
  return pngArray;
}

function generatePng(width: number, height: number, rgbaString: string) {
  const DEFLATE_METHOD = String.fromCharCode(0x78, 0x01);
  const CRC_TABLE: number[] = [];
  const SIGNATURE = String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10);
  const NO_FILTER = String.fromCharCode(0);

  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    CRC_TABLE[n] = c;
  }

  function inflateStore(data: string) {
    const MAX_STORE_LENGTH = 65535;
    let storeBuffer = "";
    for (let i = 0; i < data.length; i += MAX_STORE_LENGTH) {
      const remaining = Math.min(data.length - i, MAX_STORE_LENGTH);
      const blockType =
        remaining === data.length - i ? String.fromCharCode(0x01) : String.fromCharCode(0x00);
      storeBuffer += blockType + String.fromCharCode(remaining & 0xff, (remaining & 0xff00) >>> 8);
      storeBuffer += String.fromCharCode(~remaining & 0xff, (~remaining & 0xff00) >>> 8);
      storeBuffer += data.substring(i, i + remaining);
    }
    return storeBuffer;
  }

  function adler32(data: string) {
    const MOD_ADLER = 65521;
    let a = 1;
    let b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data.charCodeAt(i)) % MOD_ADLER;
      b = (b + a) % MOD_ADLER;
    }
    return (b << 16) | a;
  }

  function crc(buf: string) {
    let c = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
      c = CRC_TABLE[(c ^ buf.charCodeAt(n)) & 0xff]! ^ (c >>> 8);
    }
    return c ^ 0xffffffff;
  }

  function dwordAsString(dword: number) {
    return String.fromCharCode(
      (dword & 0xff000000) >>> 24,
      (dword & 0x00ff0000) >>> 16,
      (dword & 0x0000ff00) >>> 8,
      dword & 0x000000ff,
    );
  }

  function createChunk(length: number, type: string, data: string) {
    return dwordAsString(length) + type + data + dwordAsString(crc(type + data));
  }

  const IHDR = createChunk(
    13,
    "IHDR",
    dwordAsString(width) + dwordAsString(height) + String.fromCharCode(8, 6, 0, 0, 0),
  );

  let scanlines = "";
  for (let y = 0; y < rgbaString.length; y += width * 4) {
    scanlines += NO_FILTER + rgbaString.substr(y, width * 4);
  }

  const compressed = DEFLATE_METHOD + inflateStore(scanlines) + dwordAsString(adler32(scanlines));
  const IDAT = createChunk(compressed.length, "IDAT", compressed);
  const IEND = createChunk(0, "IEND", "");

  return SIGNATURE + IHDR + IDAT + IEND;
}
