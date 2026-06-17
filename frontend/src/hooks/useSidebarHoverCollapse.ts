'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

const SIDEBAR_PINNED_COLLAPSED_KEY = 'arris-company-admin-sidebar-pinned-collapsed';

function readPinnedCollapsed(): boolean | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(SIDEBAR_PINNED_COLLAPSED_KEY);
        if (raw === 'true') return true;
        if (raw === 'false') return false;
    } catch {
        /* noop */
    }
    return null;
}

function writePinnedCollapsed(value: boolean) {
    try {
        window.sessionStorage.setItem(SIDEBAR_PINNED_COLLAPSED_KEY, String(value));
    } catch {
        /* noop */
    }
}

function subscribeDesktop(cb: () => void) {
    const mq = window.matchMedia('(min-width: 1024px)');
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
}

function getDesktopSnapshot() {
    return window.matchMedia('(min-width: 1024px)').matches;
}

/** SSR / hydration: assume desktop so first paint uses narrow rail (no expand→collapse flash). */
function getServerDesktopSnapshot() {
    return true;
}

function getInitialPinnedCollapsed(): boolean {
    if (typeof window === 'undefined') return true;
    return readPinnedCollapsed() ?? true;
}

/**
 * Desktop (lg+): optional narrow rail (“pinned collapsed”); widens while the pointer is over the sidebar.
 * Pinned collapsed / expanded preference survives route changes when the dashboard layout remounts (many
 * routes wrap `CompanyAdminDashboardLayout` directly). Only the navbar toggle persists that preference;
 * hovering does not overwrite it.
 * Main content margin and navbar offset follow the same collapsed state (68px vs 260px), including on hover.
 * Mobile: drawer is full width when open (no hover behavior).
 */
export function useSidebarHoverCollapse() {
    const [pinnedCollapsed, setPinnedCollapsed] = useState(getInitialPinnedCollapsed);
    const [hoverExpanded, setHoverExpanded] = useState(false);
    /** Enables width/margin transitions only after layout paint; avoids easing on remount/nav when state syncs from sessionStorage */
    const [motionReady, setMotionReady] = useState(false);

    const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getServerDesktopSnapshot);

    useEffect(() => {
        const id = window.requestAnimationFrame(() => setMotionReady(true));
        return () => window.cancelAnimationFrame(id);
    }, []);

    const effectiveCollapsed = isDesktop ? pinnedCollapsed && !hoverExpanded : false;

    const sidebarWidthTransitionClasses = motionReady
        ? 'transition-[width,background-color,color] duration-300 ease-out'
        : 'transition-none';

    const mainMarginTransitionClasses = motionReady ? 'transition-[margin] duration-300 ease-out' : 'transition-none';

    const togglePinned = useCallback(() => {
        setPinnedCollapsed((c) => {
            const next = !c;
            writePinnedCollapsed(next);
            return next;
        });
    }, []);

    const hoverProps = useMemo(
        () =>
            isDesktop
                ? {
                      onMouseEnter: () => setHoverExpanded(true),
                      onMouseLeave: () => setHoverExpanded(false),
                  }
                : {},
        [isDesktop]
    );

    return {
        effectiveCollapsed,
        togglePinned,
        hoverProps,
        sidebarWidthTransitionClasses,
        mainMarginTransitionClasses,
        /** Desktop: `true` = narrow rail + expand on hover; `false` = sidebar stays full width (260px). */
        desktopHoverRailMode: pinnedCollapsed,
    };
}
