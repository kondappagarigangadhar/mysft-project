import type { PlatformFoundationTabId } from '@/lib/platformFoundationTypes';

export const PLATFORM_FOUNDATION_TAB_ORDER: PlatformFoundationTabId[] = [
    'organization',
    'security',
    'subscription',
    'branding',
    'audit',
];

export function normalizePlatformFoundationTab(raw: string | null): PlatformFoundationTabId {
    const id = raw?.toLowerCase();
    if (id && PLATFORM_FOUNDATION_TAB_ORDER.includes(id as PlatformFoundationTabId)) {
        return id as PlatformFoundationTabId;
    }
    return 'organization';
}
