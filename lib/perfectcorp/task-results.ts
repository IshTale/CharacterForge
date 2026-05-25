type ResultRecord = Record<string, unknown>;

export interface ParsedTaskResult {
  result_url: string | null;
  dst_id: string | null;
}

function findStringByKey(value: unknown, keys: string[]): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringByKey(item, keys);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as ResultRecord;
  for (const key of keys) {
    if (typeof record[key] === "string") {
      return record[key];
    }
  }

  for (const nested of Object.values(record)) {
    const found = findStringByKey(nested, keys);
    if (found) {
      return found;
    }
  }

  return null;
}

function parseResultEntry(entry: unknown): ParsedTaskResult {
  if (typeof entry === "string" && entry.startsWith("http")) {
    return { result_url: entry, dst_id: null };
  }

  return {
    result_url: findStringByKey(entry, ["url", "download_url", "result_url", "image_url"]),
    dst_id: findStringByKey(entry, ["dst_id", "file_id"])
  };
}

export function parseTaskResult(
  results: unknown,
  fallbackDstId: string | null = null
): ParsedTaskResult {
  const parsed = parseResultEntry(results);
  return {
    result_url: parsed.result_url,
    dst_id: parsed.dst_id ?? fallbackDstId
  };
}
