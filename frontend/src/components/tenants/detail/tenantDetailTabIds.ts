export type TenantDetailMainTabId = 'overview' | 'history';

export const TENANT_DETAIL_PRIMARY_TAB_ORDER: TenantDetailMainTabId[] = ['overview', 'history'];

export function normalizeTenantDetailTab(raw: string | null | undefined): TenantDetailMainTabId {
    const t = (raw || '').trim().toLowerCase();
    const allowed = new Set<string>(TENANT_DETAIL_PRIMARY_TAB_ORDER);
    if (allowed.has(t)) return t as TenantDetailMainTabId;
    return 'overview';
}
