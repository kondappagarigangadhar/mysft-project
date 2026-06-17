/**
 * Canonical lead profile URLs for the main CRM module.
 * `slug` must match `Lead.slug` from `leadStore` (same field the API should expose).
 */
export const LEAD_PROFILE_VIEW_BASE = '/leads/view' as const;

export function leadProfileHref(slug: string): string {
    if (!slug.trim()) return '/leads';
    return `${LEAD_PROFILE_VIEW_BASE}/${encodeURIComponent(slug)}`;
}

/** Opens the lead profile with the inline edit sheet (same page). */
export function leadProfileEditHref(slug: string): string {
    if (!slug.trim()) return '/leads';
    return `${LEAD_PROFILE_VIEW_BASE}/${encodeURIComponent(slug)}?edit=1`;
}
