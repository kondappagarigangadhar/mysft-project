export type GlobalSavedView = {
    id: string;
    name: string;
    module: string;
    route: string;
    filters: Record<string, unknown>;
    createdAt: string;
    createdBy: string;
    pinned?: boolean;
};

const STORAGE_KEY = 'arris-global-saved-views-v1';

/** Stable empty snapshot for `useSyncExternalStore` server snapshot and empty client state. */
export const EMPTY_GLOBAL_SAVED_VIEWS_SNAPSHOT: GlobalSavedView[] = [];

let syncSnapshotJson: string | null = null;
let syncSnapshotViews: GlobalSavedView[] = EMPTY_GLOBAL_SAVED_VIEWS_SNAPSHOT;

/** Session bridge so navigating from the navbar can apply filters on the target page. */
export const PENDING_SAVED_VIEW_SESSION_KEY = 'arris-saved-view-pending-apply-v1';

/** Matches company admin navbar placeholder until real auth supplies a display name. */
export const DEFAULT_SAVED_VIEW_AUTHOR = 'Company Admin';

/** Pathname + optional `?query` (query keys sorted) so list vs `?booking=` ledger views stay distinct. */
export function normalizeSavedViewRoute(route: string): string {
    if (!route) return '/';
    const trimmed = route.trim();
    const qMark = trimmed.indexOf('?');
    const pathPart = (qMark >= 0 ? trimmed.slice(0, qMark) : trimmed).trim();
    const searchPart = qMark >= 0 ? trimmed.slice(qMark + 1) : '';
    let pathNorm = pathPart.endsWith('/') && pathPart.length > 1 ? pathPart.slice(0, -1) : pathPart;
    if (!pathNorm) pathNorm = '/';
    if (!searchPart) return pathNorm;
    const sp = new URLSearchParams(searchPart);
    const keys = [...new Set(sp.keys())].sort((a, b) => a.localeCompare(b));
    const sorted = keys.map((k) => sp.getAll(k).map((v) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')).join('&');
    return sorted ? `${pathNorm}?${sorted}` : pathNorm;
}

function notifySavedViewsChanged() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('arris-global-saved-views-changed'));
}

export function loadGlobalSavedViews(): GlobalSavedView[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as GlobalSavedView[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveGlobalSavedViews(views: GlobalSavedView[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
        notifySavedViewsChanged();
    } catch {
        /* ignore */
    }
}

/** Replace every saved view for a single route with the given list (used by filter drawers). */
export function replaceViewsForRoute(
    route: string,
    module: string,
    nextLegacy: Array<{ id: string; name: string; payload: Record<string, unknown> }>,
    createdBy: string,
) {
    const norm = normalizeSavedViewRoute(route);
    const all = loadGlobalSavedViews();
    const kept = all.filter((v) => normalizeSavedViewRoute(v.route) !== norm);
    const existingById = new Map(all.map((v) => [v.id, v]));
    const merged = nextLegacy.map((row) => {
        const prev = existingById.get(row.id);
        const next: GlobalSavedView = {
            id: row.id,
            name: row.name,
            module,
            route: norm,
            filters: row.payload,
            createdAt: prev?.createdAt ?? new Date().toISOString(),
            createdBy: prev?.createdBy ?? createdBy,
            pinned: prev?.pinned ?? false,
        };
        return next;
    });
    saveGlobalSavedViews([...kept, ...merged]);
}

/** Copy legacy per-page localStorage into the global store once (no-op if that route already has views). */
export function importLegacyLocalSavedViewsOnce(
    route: string,
    module: string,
    legacyStorageKey: string,
    createdBy: string,
) {
    if (typeof window === 'undefined') return;
    const norm = normalizeSavedViewRoute(route);
    const hasGlobal = loadGlobalSavedViews().some((v) => normalizeSavedViewRoute(v.route) === norm);
    if (hasGlobal) return;
    try {
        const raw = localStorage.getItem(legacyStorageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Array<{ id: string; name: string; payload: Record<string, unknown> }>;
        if (!Array.isArray(parsed) || parsed.length === 0) return;
        replaceViewsForRoute(route, module, parsed, createdBy);
    } catch {
        /* ignore */
    }
}

export function deleteGlobalSavedViewById(id: string) {
    saveGlobalSavedViews(loadGlobalSavedViews().filter((v) => v.id !== id));
}

export function setGlobalSavedViewPinned(id: string, pinned: boolean) {
    saveGlobalSavedViews(
        loadGlobalSavedViews().map((v) => (v.id === id ? { ...v, pinned } : v)),
    );
}

export function renameGlobalSavedView(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    saveGlobalSavedViews(
        loadGlobalSavedViews().map((v) => (v.id === id ? { ...v, name: trimmed } : v)),
    );
}

export function queueNavigateWithSavedView(view: GlobalSavedView) {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(
            PENDING_SAVED_VIEW_SESSION_KEY,
            JSON.stringify({
                route: normalizeSavedViewRoute(view.route),
                filters: view.filters,
            }),
        );
    } catch {
        /* ignore */
    }
}

export function consumePendingSavedViewFilters(currentPathname: string): Record<string, unknown> | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(PENDING_SAVED_VIEW_SESSION_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as { route?: string; filters?: Record<string, unknown> };
        const target = data.route ? normalizeSavedViewRoute(data.route) : '';
        const here = normalizeSavedViewRoute(currentPathname);
        if (!data.filters || target !== here) return null;
        sessionStorage.removeItem(PENDING_SAVED_VIEW_SESSION_KEY);
        return data.filters;
    } catch {
        return null;
    }
}

export function subscribeGlobalSavedViews(listener: () => void) {
    if (typeof window === 'undefined') return () => {};
    const fn = () => listener();
    window.addEventListener('arris-global-saved-views-changed', fn);
    window.addEventListener('storage', fn);
    return () => {
        window.removeEventListener('arris-global-saved-views-changed', fn);
        window.removeEventListener('storage', fn);
    };
}

/**
 * Snapshot for `useSyncExternalStore`: returns the same array reference until localStorage JSON changes,
 * so React does not re-render in a loop.
 */
export function getGlobalSavedViewsSnapshot(): GlobalSavedView[] {
    if (typeof window === 'undefined') {
        return EMPTY_GLOBAL_SAVED_VIEWS_SNAPSHOT;
    }
    let json: string;
    try {
        json = window.localStorage.getItem(STORAGE_KEY) ?? '[]';
    } catch {
        return syncSnapshotViews;
    }
    if (json === syncSnapshotJson) {
        return syncSnapshotViews;
    }
    syncSnapshotJson = json;
    try {
        const parsed = JSON.parse(json) as GlobalSavedView[];
        if (!Array.isArray(parsed) || parsed.length === 0) {
            syncSnapshotViews = EMPTY_GLOBAL_SAVED_VIEWS_SNAPSHOT;
        } else {
            syncSnapshotViews = parsed;
        }
    } catch {
        syncSnapshotViews = EMPTY_GLOBAL_SAVED_VIEWS_SNAPSHOT;
    }
    return syncSnapshotViews;
}

export function sortSavedViewsForDisplay(views: GlobalSavedView[]): GlobalSavedView[] {
    return [...views].sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (bp !== ap) return bp - ap;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
}
