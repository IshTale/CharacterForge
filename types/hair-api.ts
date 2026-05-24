import type { HairColorPalette, HairColorPattern } from "@/types/hair";

export interface HairColorTaskPayload {
  src_file_id: string;
  preset?: string;
  pattern?: HairColorPattern;
  palettes?: HairColorPalette[];
}
