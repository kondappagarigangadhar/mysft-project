export const LEAD_DETAIL_TAB_IDS = [
    'overview',
    'follow-up',
    'site-visit',
    'conversion',
    'notes',
    'activity',
    'assignment',
    'pipeline',
    'broker',
    'notifications',
] as const;

export type LeadDetailMainTabId = (typeof LEAD_DETAIL_TAB_IDS)[number];

/** Primary navigation row (secondary items live under More). */
export const LEAD_DETAIL_PRIMARY_TAB_ORDER = [
    'overview',
    'follow-up',
    'site-visit',
    'conversion',
    'notes',
    'activity',
] as const satisfies readonly LeadDetailMainTabId[];

export const LEAD_DETAIL_MORE_TAB_ORDER = [
    'assignment',
    'pipeline',
    'broker',
    'notifications',
] as const satisfies readonly LeadDetailMainTabId[];

const VALID = new Set<string>(LEAD_DETAIL_TAB_IDS);

export function normalizeLeadDetailTab(tab: string | null): LeadDetailMainTabId {
    if (tab === 'notes-files' || tab === 'attachments') return 'notes';
    if (tab && VALID.has(tab)) return tab as LeadDetailMainTabId;
    return 'overview';
}

