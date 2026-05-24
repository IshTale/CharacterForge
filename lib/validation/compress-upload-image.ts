import { VERCEL_SAFE_MAX_BYTES } from "@/constants/upload-limits";
import { getImageDimensionsFromFile, longSide, type ImageDimensions } from "@/lib/validation/image-dimensions";

export interface CompressUploadOptions {
  maxBytes?: number;
  maxLongSidePx?: number;
}

function scaledDimensions(
  { width, height }: ImageDimensions,
  maxLongSidePx: number
): ImageDimensions {
  const side = longSide({ width, height });
  if (side <= maxLongSidePx) {
    return { width, height };
  }
  const scale = maxLongSidePx / side;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function loadImageSource(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close()
    };
  }

  const url = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for compression."));
    img.src = url;
  });

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url)
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

function outputFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "upload";
  return `${base}.jpg`;
}

/**
 * Resize/re-encode images so uploads stay under Vercel's ~4.5 MB API body limit.
 * No-op in environments without canvas (should only run in the browser).
 */
export async function compressImageForUpload(
  file: File,
  options: CompressUploadOptions = {}
): Promise<File> {
  if (typeof document === "undefined") {
    return file;
  }

  const maxBytes = options.maxBytes ?? VERCEL_SAFE_MAX_BYTES;
  const maxLongSidePx = options.maxLongSidePx ?? 2048;

  const dimensions = await getImageDimensionsFromFile(file);
  let target = scaledDimensions(dimensions, maxLongSidePx);

  if (file.size <= maxBytes && longSide(target) === longSide(dimensions)) {
    return file;
  }

  const { source, cleanup } = await loadImageSource(file);

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas is not available for image compression.");
    }

    const qualities = [0.88, 0.78, 0.68, 0.58, 0.48];
    let bestBlob: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = target.width;
      canvas.height = target.height;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.drawImage(source, 0, 0, target.width, target.height);

      for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, quality);
        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
        }
        if (blob.size <= maxBytes) {
          return new File([blob], outputFileName(file.name), {
            type: "image/jpeg",
            lastModified: file.lastModified
          });
        }
      }

      target = {
        width: Math.max(1, Math.round(target.width * 0.85)),
        height: Math.max(1, Math.round(target.height * 0.85))
      };
    }

    if (!bestBlob) {
      throw new Error("Failed to compress image.");
    }

    if (bestBlob.size > maxBytes) {
      throw new Error(
        `Image is too large after compression (${(bestBlob.size / (1024 * 1024)).toFixed(1)}MB). Use a smaller photo or lower resolution.`
      );
    }

    return new File([bestBlob], outputFileName(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified
    });
  } finally {
    cleanup();
  }
}
