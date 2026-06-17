export const WORK_ORDER_PROFILE_VIEW_BASE = '/work-orders/view' as const;

export function workOrderProfileHref(slug: string): string {
    if (!slug.trim()) return '/work-orders';
    return `${WORK_ORDER_PROFILE_VIEW_BASE}/${encodeURIComponent(slug)}`;
}

export function workOrderProfileEditHref(slug: string): string {
    if (!slug.trim()) return '/work-orders';
    return `${WORK_ORDER_PROFILE_VIEW_BASE}/${encodeURIComponent(slug)}?edit=1`;
}

