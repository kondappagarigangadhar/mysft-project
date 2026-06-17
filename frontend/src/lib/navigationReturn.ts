/** Only same-origin app paths; blocks protocol-relative and external URLs. */
export function safeInternalPath(path: string | undefined): string {
    const p = path?.trim() ?? '';
    if (!p.startsWith('/') || p.startsWith('//')) return '';
    return p;
}

/**
 * After creating a resource (booking, payment, …): use explicit `?returnTo=` when present,
 * otherwise go back in history, otherwise `fallback` (e.g. direct open / empty history).
 */
export function navigateAfterResourceCreate(
    router: { push: (href: string) => void; back: () => void },
    options: { returnTo: string; fallback: string }
): void {
    const safe = safeInternalPath(options.returnTo);
    if (safe) {
        router.push(safe);
        return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
        return;
    }
    router.push(options.fallback);
}
