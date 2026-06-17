export type SupplierMainTabId =
    | 'overview'
    | 'performance'
    | 'notes'
    | 'history';

const ALLOWED = new Set<SupplierMainTabId>([
    'overview',
    'performance',
    'notes',
    'history',
]);

export function normalizeSupplierDetailTab(raw: string | null | undefined): SupplierMainTabId {
    if (raw && ALLOWED.has(raw as SupplierMainTabId)) return raw as SupplierMainTabId;
    return 'overview';
}
