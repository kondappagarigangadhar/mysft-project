const PREFIX = 'arris-ai:';

type Entry = { at: number; ttl: number; data: unknown };

export function readAiCache<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(PREFIX + key);
        if (!raw) return null;
        const e = JSON.parse(raw) as Entry;
        if (Date.now() - e.at > e.ttl) {
            window.sessionStorage.removeItem(PREFIX + key);
            return null;
        }
        return e.data as T;
    } catch {
        return null;
    }
}

export function writeAiCache(key: string, data: unknown, ttlMs: number) {
    if (typeof window === 'undefined') return;
    try {
        const entry: Entry = { at: Date.now(), ttl: ttlMs, data };
        window.sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
        /* ignore quota */
    }
}
