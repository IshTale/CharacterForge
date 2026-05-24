import type { HairTransferSelection } from "@/types/hair";

export interface HairTransferTaskPayload {
  src_file_id: string;
  template_id?: string;
  ref_file_id?: string;
  ref_file_url?: string;
}

export function buildHairTransferPayload(
  srcFileId: string,
  transfer: HairTransferSelection
): HairTransferTaskPayload {
  const payload: HairTransferTaskPayload = { src_file_id: srcFileId };

  if (transfer.mode === "template") {
    if (!transfer.template_id) {
      throw new Error("Select a hairstyle template.");
    }
    payload.template_id = transfer.template_id;
    return payload;
  }

  if (transfer.ref_file_id) {
    payload.ref_file_id = transfer.ref_file_id;
    return payload;
  }

  if (transfer.ref_image_url) {
    payload.ref_file_url = transfer.ref_image_url;
    return payload;
  }

  throw new Error("Upload a hairstyle reference or pick a template.");
}
