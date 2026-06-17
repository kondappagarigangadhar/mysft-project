export const RESIDENT_WORKSPACE_TAB_IDS = ['overview', 'notices', 'visitors', 'amenities', 'records', 'lease', 'activity'] as const;

export type ResidentWorkspaceTabId = (typeof RESIDENT_WORKSPACE_TAB_IDS)[number];

export const RESIDENT_WORKSPACE_TAB_ORDER: ResidentWorkspaceTabId[] = [
    'overview',
    'notices',
    'visitors',
    'amenities',
    'records',
    'lease',
    'activity',
];

const VALID = new Set<string>(RESIDENT_WORKSPACE_TAB_IDS);

/** URL `tab` param normalization (legacy aliases supported). */
export function normalizeResidentWorkspaceTab(tab: string | null): ResidentWorkspaceTabId {
    if (tab === 'history' || tab === 'activity') return 'activity';
    if (tab === 'access' || tab === 'documents') return 'overview';
    if (tab === 'announcements' || tab === 'notices-announcements') return 'notices';
    if (tab === 'visitor' || tab === 'visitor-passes') return 'visitors';
    if (tab === 'amenity' || tab === 'amenity-bookings') return 'amenities';
    if (tab === 'resident-records' || tab === 'records') return 'records';
    if (tab === 'lease' || tab === 'rental-lease' || tab === 'lease-agreement') return 'lease';
    if (tab && VALID.has(tab)) return tab as ResidentWorkspaceTabId;
    return 'overview';
}
