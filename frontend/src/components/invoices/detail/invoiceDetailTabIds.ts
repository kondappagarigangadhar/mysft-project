export type InvoiceDetailMainTabId =
    | 'overview'
    | 'validation'
    | 'payments'
    | 'documents'
    | 'notifications'
    | 'activity';

export const INVOICE_DETAIL_PRIMARY_TAB_ORDER: InvoiceDetailMainTabId[] = [
    'overview',
    'validation',
    'payments',
    'documents',
    'notifications',
    'activity',
];

export const INVOICE_DETAIL_MORE_TAB_ORDER: InvoiceDetailMainTabId[] = [];

export function normalizeInvoiceDetailTab(input: string | null): InvoiceDetailMainTabId {
    const raw = (input ?? '').trim();
    const all: string[] = [...INVOICE_DETAIL_PRIMARY_TAB_ORDER, ...INVOICE_DETAIL_MORE_TAB_ORDER];
    if (all.includes(raw)) return raw as InvoiceDetailMainTabId;
    /** Legacy alias: `?tab=history` → `activity` (history is the History tab). */
    if (raw === 'history') return 'activity';
    return 'overview';
}
