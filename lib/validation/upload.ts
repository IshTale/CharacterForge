import { CANVAS_UPLOAD_REQUIREMENTS } from "@/constants/upload-requirements";
import {
  getImageDimensionsFromBuffer,
  getImageDimensionsFromFile,
  longSide,
  type ImageDimensions
} from "@/lib/validation/image-dimensions";
import { assertSupportedImageMime } from "@/lib/validation/mime";
import type { CanvasKey } from "@/types/canvas";

interface FileLike {
  type: string;
  size: number;
  name?: string;
}

const CANVAS_MAX_LONG_SIDE: Record<CanvasKey, number> = {
  headshot: CANVAS_UPLOAD_REQUIREMENTS.headshot.maxLongSidePx,
  fullbody: CANVAS_UPLOAD_REQUIREMENTS.fullbody.maxLongSidePx,
  handwrist: CANVAS_UPLOAD_REQUIREMENTS.handwrist.maxLongSidePx,
  feet: CANVAS_UPLOAD_REQUIREMENTS.feet.maxLongSidePx
};

export class ImageValidator {
  private static resolveMime(file: FileLike, bytes?: Uint8Array) {
    return assertSupportedImageMime(file.type, file.name ?? "", bytes);
  }

  private static validateMimeAndSize(file: FileLike, maxMb: number, bytes?: Uint8Array) {
    this.resolveMime(file, bytes);
    if (file.size > maxMb * 1024 * 1024) {
      throw new Error(`Image must be <= ${maxMb}MB.`);
    }
  }

  private static validateLongSide(
    dimensions: ImageDimensions,
    maxLongSidePx: number,
    canvasLabel: string
  ) {
    const side = longSide(dimensions);
    if (side > maxLongSidePx) {
      throw new Error(
        `${canvasLabel} long side is ${side}px. Maximum allowed is ${maxLongSidePx}px.`
      );
    }
  }

  static validateHeadshot(file: FileLike, dimensions?: ImageDimensions, bytes?: Uint8Array) {
    this.validateMimeAndSize(file, 10, bytes);
    if (dimensions) {
      this.validateLongSide(dimensions, CANVAS_MAX_LONG_SIDE.headshot, "Headshot");
    }
  }

  static validateFullBody(file: FileLike, dimensions?: ImageDimensions, bytes?: Uint8Array) {
    this.validateMimeAndSize(file, 10, bytes);
    if (dimensions) {
      this.validateLongSide(dimensions, CANVAS_MAX_LONG_SIDE.fullbody, "Full body");
    }
  }

  static validateHandWrist(file: FileLike, dimensions?: ImageDimensions, bytes?: Uint8Array) {
    this.validateMimeAndSize(file, 10, bytes);
    if (dimensions) {
      this.validateLongSide(dimensions, CANVAS_MAX_LONG_SIDE.handwrist, "Hand & wrist");
    }
  }

  static validateFeet(file: FileLike, dimensions?: ImageDimensions, bytes?: Uint8Array) {
    this.validateMimeAndSize(file, 10, bytes);
    if (dimensions) {
      this.validateLongSide(dimensions, CANVAS_MAX_LONG_SIDE.feet, "Feet");
    }
  }

  static validateAccessory(file: FileLike, bytes?: Uint8Array) {
    this.validateMimeAndSize(file, 5, bytes);
  }

  static validateCanvas(
    canvas: CanvasKey,
    file: FileLike,
    dimensions?: ImageDimensions,
    bytes?: Uint8Array
  ) {
    if (canvas === "headshot") this.validateHeadshot(file, dimensions, bytes);
    if (canvas === "fullbody") this.validateFullBody(file, dimensions, bytes);
    if (canvas === "handwrist") this.validateHandWrist(file, dimensions, bytes);
    if (canvas === "feet") this.validateFeet(file, dimensions, bytes);
  }

  /** Client-side: MIME, size, and resolution before upload. */
  static async validateCanvasFile(canvas: CanvasKey, file: File) {
    const dimensions = await getImageDimensionsFromFile(file);
    this.validateCanvas(canvas, file, dimensions);
    return dimensions;
  }

  /** Server-side: MIME, size, and resolution from raw bytes. */
  static validateCanvasBuffer(canvas: CanvasKey, file: FileLike, bytes: Uint8Array) {
    const dimensions = getImageDimensionsFromBuffer(bytes);
    if (!dimensions) {
      throw new Error("Could not read image dimensions. Use a valid JPG or PNG file.");
    }
    this.validateCanvas(canvas, { ...file, name: file.name ?? "" }, dimensions, bytes);
  }
}
