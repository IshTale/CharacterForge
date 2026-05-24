import { MODULE_CONFIG } from "@/constants/api-modules";
import type { NormalisedError } from "@/types/perfectcorp";

export class PerfectCorpClient {
  getModuleConfig(module: string) {
    const config = MODULE_CONFIG[module];
    if (!config) {
      throw new Error(`Unsupported module: ${module}`);
    }
    return config;
  }

  normaliseUnknownError(error: unknown): NormalisedError {
    if (error instanceof Error) {
      return {
        code: "UNKNOWN",
        message: error.message,
        retryable: false,
        userFacingMessage: "Processing failed. Please try again."
      };
    }

    return {
      code: "UNKNOWN",
      message: "Unknown error",
      retryable: false,
      userFacingMessage: "Processing failed. Please try again."
    };
  }
}
