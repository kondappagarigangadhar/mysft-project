export const SERVICE_MAINTENANCE_TAB_IDS = ['overview', 'activity'] as const;

export type ServiceMaintenanceTabId = (typeof SERVICE_MAINTENANCE_TAB_IDS)[number];

/** Primary tab bar — Overview holds all ticket sections; History is separate. */
export const SERVICE_MAINTENANCE_PRIMARY_TAB_ORDER = ['overview', 'activity'] as const satisfies readonly ServiceMaintenanceTabId[];

export const SERVICE_MAINTENANCE_MORE_TAB_ORDER = [] as const satisfies readonly ServiceMaintenanceTabId[];

const VALID = new Set<string>(SERVICE_MAINTENANCE_TAB_IDS);

/** Legacy tab query values fold into Overview. */
const LEGACY_OVERVIEW_TABS = new Set(['sla', 'vendor', 'resolution', 'attachments']);

export function normalizeServiceMaintenanceTab(tab: string | null): ServiceMaintenanceTabId {
    if (tab === 'history') return 'activity';
    if (tab && LEGACY_OVERVIEW_TABS.has(tab)) return 'overview';
    if (tab && VALID.has(tab)) return tab as ServiceMaintenanceTabId;
    return 'overview';
}
