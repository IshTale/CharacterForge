"use client";

import { useCallback, useEffect, useState } from "react";
import type { HairTransferTemplate } from "@/types/hair";

interface UseHairTemplatesResult {
  templates: HairTransferTemplate[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  nextToken: string | null;
  loadMore: () => void;
}

export function useHairTemplates(): UseHairTemplatesResult {
  const [templates, setTemplates] = useState<HairTransferTemplate[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (token?: string) => {
    const isMore = Boolean(token);
    if (isMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({ page_size: "20" });
      if (token) {
        params.set("starting_token", token);
      }

      const response = await fetch(`/api/perfectcorp/catalog/hair-transfer?${params}`);
      const payload = (await response.json()) as {
        templates?: HairTransferTemplate[];
        next_token?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load hairstyle templates.");
      }

      setTemplates((current) =>
        isMore ? [...current, ...(payload.templates ?? [])] : (payload.templates ?? [])
      );
      setNextToken(payload.next_token ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load templates.");
      if (!isMore) {
        setTemplates([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const loadMore = useCallback(() => {
    if (nextToken && !loadingMore) {
      void loadTemplates(nextToken);
    }
  }, [nextToken, loadingMore, loadTemplates]);

  return {
    templates,
    loading,
    loadingMore,
    error,
    nextToken,
    loadMore
  };
}
