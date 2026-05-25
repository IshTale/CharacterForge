interface ResultEntry {
  url?: string;
  download_url?: string;
  data?: Array<{ dst_id?: string }>;
}

export interface ParsedTaskResult {
  result_url: string | null;
  dst_id: string | null;
}

function parseResultEntry(entry: ResultEntry | undefined): ParsedTaskResult {
  return {
    result_url: entry?.url ?? entry?.download_url ?? null,
    dst_id: entry?.data?.[0]?.dst_id ?? null
  };
}

export function parseTaskResult(
  results: unknown,
  fallbackDstId: string | null = null
): ParsedTaskResult {
  if (Array.isArray(results)) {
    const parsed = parseResultEntry(results[0] as ResultEntry | undefined);
    return {
      result_url: parsed.result_url,
      dst_id: parsed.dst_id ?? fallbackDstId
    };
  }

  if (typeof results === "object" && results !== null) {
    const parsed = parseResultEntry(results as ResultEntry);
    return {
      result_url: parsed.result_url,
      dst_id: parsed.dst_id ?? fallbackDstId
    };
  }

  if (typeof results === "string" && results.startsWith("http")) {
    return { result_url: results, dst_id: fallbackDstId };
  }

  return { result_url: null, dst_id: fallbackDstId };
}
