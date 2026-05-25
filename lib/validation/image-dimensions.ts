export interface ImageDimensions {
  width: number;
  height: number;
}

export function longSide({ width, height }: ImageDimensions): number {
  return Math.max(width, height);
}

export function shortSide({ width, height }: ImageDimensions): number {
  return Math.min(width, height);
}

/** Read width/height from PNG or JPEG file headers (server-safe). */
export function getImageDimensionsFromBuffer(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 24) {
    return null;
  }

  // PNG: 89 50 4E 47 — IHDR at offset 16
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes.length >= 24
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
      width: view.getUint32(16, false),
      height: view.getUint32(20, false)
    };
  }

  // JPEG: FF D8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        break;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const segmentLength = (bytes[offset + 2] << 8) + bytes[offset + 3];
      if (segmentLength < 2) {
        break;
      }
      const isSof =
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc5 ||
        marker === 0xc6 ||
        marker === 0xc7 ||
        marker === 0xc9 ||
        marker === 0xca ||
        marker === 0xcb ||
        marker === 0xcd ||
        marker === 0xce ||
        marker === 0xcf;
      if (isSof && offset + 7 < bytes.length) {
        return {
          height: (bytes[offset + 5] << 8) + bytes[offset + 6],
          width: (bytes[offset + 7] << 8) + bytes[offset + 8]
        };
      }
      offset += 2 + segmentLength;
    }
  }

  return null;
}

/** Browser-only dimension read for client-side validation. */
export async function getImageDimensionsFromFile(file: File): Promise<ImageDimensions> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };
    image.src = url;
  });
}
