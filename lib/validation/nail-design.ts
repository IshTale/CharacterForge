import {
  getImageDimensionsFromBuffer,
  getImageDimensionsFromFile,
  type ImageDimensions
} from "@/lib/validation/image-dimensions";
import { assertSupportedImageMime } from "@/lib/validation/mime";

const MAX_BYTES = 1 * 1024 * 1024;
const MIN_WIDTH = 271;
const MAX_WIDTH = 542;
const MIN_HEIGHT = 522;
const MAX_HEIGHT = 1044;
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 3.5;

function validatePressOnDimensions(dimensions: ImageDimensions) {
  const { width, height } = dimensions;
  if (width < MIN_WIDTH || width > MAX_WIDTH) {
    throw new Error(
      `Press-on nail art width must be ${MIN_WIDTH}–${MAX_WIDTH}px (yours is ${width}px).`
    );
  }
  if (height < MIN_HEIGHT || height > MAX_HEIGHT) {
    throw new Error(
      `Press-on nail art height must be ${MIN_HEIGHT}–${MAX_HEIGHT}px (yours is ${height}px).`
    );
  }
  const aspect = height / width;
  if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) {
    throw new Error(
      `Press-on nail art aspect ratio (H/W) must be ${MIN_ASPECT}–${MAX_ASPECT} (yours is ${aspect.toFixed(2)}).`
    );
  }
}

export async function validatePressOnNailDesignFile(file: File) {
  if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
    throw new Error("Press-on nail art must be a PNG with a transparent background.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Press-on nail art must be 1MB or smaller.");
  }
  const dimensions = await getImageDimensionsFromFile(file);
  validatePressOnDimensions(dimensions);
}

export function validatePressOnNailDesignBuffer(
  file: { type: string; size: number; name: string },
  bytes: Uint8Array
) {
  const mime = assertSupportedImageMime(file.type, file.name, bytes);
  if (mime !== "image/png") {
    throw new Error("Press-on nail art must be PNG with a transparent background.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Press-on nail art must be 1MB or smaller.");
  }
  const dimensions = getImageDimensionsFromBuffer(bytes);
  if (!dimensions) {
    throw new Error("Could not read nail art dimensions.");
  }
  validatePressOnDimensions(dimensions);
}
