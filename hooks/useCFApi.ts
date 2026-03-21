"use client";

import { useState, useCallback } from "react";
import { useConfig } from "@/components/ConfigProvider";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useCFApi<T>() {
  const { config } = useConfig();
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null });

  const execute = useCallback(
    async (path: string, options: RequestInit = {}): Promise<T | null> => {
      if (!config?.apiToken) {
        setState((s) => ({ ...s, error: "No API token configured" }));
        return null;
      }
      setState({ data: null, loading: true, error: null });
      try {
        const res = await fetch(`/api/cf${path}`, {
          ...options,
          headers: {
            "x-cf-token": config.apiToken,
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
          },
        });
        const json = await res.json();
        if (!json.success) {
          const msg = json.errors?.map((e: { message: string }) => e.message).join("; ") ?? "Unknown error";
          setState({ data: null, loading: false, error: msg });
          return null;
        }
        setState({ data: json as T, loading: false, error: null });
        return json as T;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setState({ data: null, loading: false, error: msg });
        return null;
      }
    },
    [config]
  );

  return { ...state, execute };
}

export function useCFToken(): string | null {
  const { config } = useConfig();
  return config?.apiToken ?? null;
}

export async function cfApiCall(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; result?: unknown; errors?: { message: string }[]; result_info?: unknown }> {
  const res = await fetch(`/api/cf${path}`, {
    ...options,
    headers: {
      "x-cf-token": token,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  return res.json();
}
