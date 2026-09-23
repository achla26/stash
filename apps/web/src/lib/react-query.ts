import { QueryClient } from "@tanstack/react-query";

// Supabase free-tier DB idle/wake or Vercel cold-start — transient network/DB errors
const TRANSIENT_RE =
  /CONNECT_TIMEOUT|CONNECTION_REFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|502|503|504|waking/i;

export function isTransientError(error: unknown): boolean {
  const e = error as {
    message?: string;
    code?: string | number;
    response?: { status?: number };
  };
  const status = e?.response?.status;
  if (typeof status === "number" && status >= 500) return true;
  return TRANSIENT_RE.test(`${e?.code ?? ""} ${e?.message ?? ""}`);
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        // transient DB/on network errors 2 retries, else 1
        retry: (count, error) => count < (isTransientError(error) ? 2 : 1),
        retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 4000),
      },
      mutations: {
        //if save fail DB wake again try
        retry: (count, error) => isTransientError(error) && count < 2,
        retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 4000),
      },
    },
  });
}
