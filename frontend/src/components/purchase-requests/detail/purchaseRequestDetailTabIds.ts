export type PurchaseRequestDetailMainTabId = 'overview' | 'activity';

export const PURCHASE_REQUEST_DETAIL_PRIMARY_TAB_ORDER: PurchaseRequestDetailMainTabId[] = [
    'overview',
    'activity',
];

export function normalizePurchaseRequestDetailTab(input: string | null): PurchaseRequestDetailMainTabId {
    const v = (input ?? '').trim();
    if (v === 'activity') return v;
    return 'overview';
}
