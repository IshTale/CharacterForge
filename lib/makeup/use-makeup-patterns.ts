"use client";

import { useEffect, useState } from "react";
import { REGION_CATALOG } from "@/constants/makeup-catalogs";
import type { MakeupPatternEntry } from "@/types/makeup";
import type { MakeupRegion } from "@/types/recipe";

interface UseMakeupPatternsResult {
  patterns: MakeupPatternEntry[];
  loading: boolean;
  error: string | null;
  hasCatalog: boolean;
}

export function useMakeupPatterns(region: MakeupRegion): UseMakeupPatternsResult {
  const catalog = REGION_CATALOG[region];
  const catalogSlug = catalog?.slug;
  const [patterns, setPatterns] = useState<MakeupPatternEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!catalogSlug) {
      setPatterns([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/styles/${catalogSlug}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Failed to load patterns (${response.status})`);
        }
        return response.json() as Promise<{ patterns: MakeupPatternEntry[] }>;
      })
      .then((data) => {
        setPatterns(data.patterns ?? []);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }
        setPatterns([]);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load patterns");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [region, catalogSlug]);

  return {
    patterns,
    loading,
    error,
    hasCatalog: Boolean(catalog)
  };
}
