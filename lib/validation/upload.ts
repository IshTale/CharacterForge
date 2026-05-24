interface FileLike {
  type: string;
  size: number;
}

const VALID_TYPES = new Set(["image/jpeg", "image/png"]);

export class ImageValidator {
  private static validateImage(file: FileLike, maxMb: number) {
    if (!VALID_TYPES.has(file.type)) {
      throw new Error("Only PNG and JPEG files are supported.");
    }
    if (file.size > maxMb * 1024 * 1024) {
      throw new Error(`Image must be <= ${maxMb}MB.`);
    }
  }

  static validateHeadshot(file: FileLike) {
    this.validateImage(file, 10);
  }

  static validateFullBody(file: FileLike) {
    this.validateImage(file, 10);
  }

  static validateHandWrist(file: FileLike) {
    this.validateImage(file, 10);
  }

  static validateFeet(file: FileLike) {
    this.validateImage(file, 10);
  }

  static validateAccessory(file: FileLike) {
    this.validateImage(file, 5);
  }
}
