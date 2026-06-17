export function safeJsonParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function readStorageJson<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const fromLocal = safeJsonParse<T>(window.localStorage.getItem(key));
    if (fromLocal) return fromLocal;
    return safeJsonParse<T>(window.sessionStorage.getItem(key));
}

export function writeStorageJson<T>(key: string, value: T, remember: boolean) {
    if (typeof window === 'undefined') return;
    const raw = JSON.stringify(value);
    if (remember) {
        window.localStorage.setItem(key, raw);
        window.sessionStorage.removeItem(key);
    } else {
        window.sessionStorage.setItem(key, raw);
        window.localStorage.removeItem(key);
    }
}

export function clearStorageKey(key: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
}

