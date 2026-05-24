import { PcErrorCode } from "@/constants/error-codes";
import type { NormalisedError } from "@/types/perfectcorp";

const DEFAULT_ERROR: NormalisedError = {
  code: "UNKNOWN",
  message: "Unknown error",
  retryable: false,
  userFacingMessage: "Processing failed. Please try again."
};

const ERROR_MAP: Partial<Record<PcErrorCode, NormalisedError>> = {
  [PcErrorCode.NO_FACE]: {
    code: PcErrorCode.NO_FACE,
    message: "No face detected.",
    retryable: true,
    userFacingMessage: "No face detected. Try a clearer photo."
  },
  [PcErrorCode.EXCEED_MAX_FILESIZE]: {
    code: PcErrorCode.EXCEED_MAX_FILESIZE,
    message: "File too large.",
    retryable: true,
    userFacingMessage: "Image is too large. Upload a smaller file."
  }
};

export function normaliseError(code: string): NormalisedError {
  return (ERROR_MAP as Record<string, NormalisedError>)[code] ?? {
    ...DEFAULT_ERROR,
    code,
    message: code
  };
}
