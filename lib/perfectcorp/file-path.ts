/** Maps proxy module keys to Perfect Corp file API path segments. */
export function resolvePerfectCorpFilePath(module: string): {
  apiVersion: "v2.0" | "v2.1";
  segment: string;
} {
  if (module === "ring" || module === "bracelet" || module === "watch") {
    return { apiVersion: "v2.0", segment: `2d-vto/${module}` };
  }
  if (module === "hair-transfer") {
    return { apiVersion: "v2.1", segment: "hair-transfer" };
  }
  return { apiVersion: "v2.0", segment: module };
}
