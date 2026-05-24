const VALID_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export function inferImageMimeType(
  reportedType: string,
  filename: string,
  bytes?: Uint8Array
): string | null {
  const normalized = reportedType.trim().toLowerCase();
  if (VALID_IMAGE_TYPES.has(normalized)) {
    return normalized;
  }

  const lowerName = filename.toLowerCase();
  if (lowerName.endsWith(".png")) {
    return "image/png";
  }
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (bytes && bytes.length >= 2) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return "image/png";
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      return "image/jpeg";
    }
  }

  return null;
}

export function assertSupportedImageMime(
  reportedType: string,
  filename: string,
  bytes?: Uint8Array
): string {
  const mime = inferImageMimeType(reportedType, filename, bytes);
  if (!mime) {
    throw new Error("Only PNG and JPEG files are supported.");
  }
  return mime;
}
