interface FileLike {
  type: string;
  size: number;
}

const VALID_TYPES = new Set(["image/jpeg", "image/png"]);

export class ImageValidator {
  static validateAccessory(file: FileLike) {
    if (!VALID_TYPES.has(file.type)) {
      throw new Error("Only PNG and JPEG files are supported.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Accessory image must be <= 5MB.");
    }
  }
}
