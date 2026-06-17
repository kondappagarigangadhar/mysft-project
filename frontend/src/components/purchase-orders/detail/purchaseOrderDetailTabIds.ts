export type PurchaseOrderDetailMainTabId = 'overview' | 'activity';

export const PURCHASE_ORDER_DETAIL_PRIMARY_TAB_ORDER: PurchaseOrderDetailMainTabId[] = ['overview', 'activity'];

export function normalizePurchaseOrderDetailTab(input: string | null): PurchaseOrderDetailMainTabId {
    const v = (input ?? '').trim() as PurchaseOrderDetailMainTabId;
    if (v === 'activity') return v;
    return 'overview';
}
