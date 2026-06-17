import axios, { type AxiosInstance } from 'axios';
import { readAiCache, writeAiCache } from '@/lib/aiResponseCache';

const baseURL =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')
        : '';

export const aiAxios: AxiosInstance = axios.create({
    baseURL,
    timeout: 90_000,
    headers: { 'Content-Type': 'application/json' },
});

function unwrapPayload<T>(raw: unknown): T {
    if (raw && typeof raw === 'object' && 'data' in raw && (raw as { data: unknown }).data !== undefined) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

export async function postAi<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
    const { data } = await aiAxios.post<unknown>(path, body);
    return unwrapPayload<T>(data);
}

/** Cached POST (sessionStorage, client-only). Skips cache if key empty. */
export async function postAiCached<T = Record<string, unknown>>(
    cacheKey: string,
    path: string,
    body: unknown,
    ttlMs = 5 * 60_000,
): Promise<T> {
    if (cacheKey && typeof window !== 'undefined') {
        const hit = readAiCache<T>(cacheKey);
        if (hit !== null) return hit;
    }
    const data = await postAi<T>(path, body);
    if (cacheKey && typeof window !== 'undefined') {
        writeAiCache(cacheKey, data, ttlMs);
    }
    return data;
}

export function getAiErrorMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string; error?: string } | undefined;
        return d?.message ?? d?.error ?? err.message ?? 'Request failed';
    }
    if (err instanceof Error) return err.message;
    return 'Something went wrong';
}
