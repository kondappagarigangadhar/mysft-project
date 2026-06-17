export type VendorInvoiceDetailMainTabId = 'overview' | 'validation' | 'payments' | 'documents';

export const VENDOR_INVOICE_DETAIL_PRIMARY_TAB_ORDER: VendorInvoiceDetailMainTabId[] = [
    'overview',
    'validation',
    'payments',
    'documents',
];

export function normalizeVendorInvoiceDetailTab(raw: string | null | undefined): VendorInvoiceDetailMainTabId {
    const t = (raw ?? '').trim().toLowerCase();
    if (t === 'validation' || t === 'payments' || t === 'documents') return t;
    return 'overview';
}
