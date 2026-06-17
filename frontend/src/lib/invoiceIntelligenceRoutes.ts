import { getInvoiceIntelBySlug } from './invoiceIntelligenceStore';

export const INVOICE_INTEL_SECTION_IDS = {
    attention: 'invoice-attention',
    health: 'invoice-health',
    repository: 'invoice-repository',
    validation: 'invoice-validation',
    poMatching: 'invoice-po-matching',
    duplicates: 'invoice-duplicates',
    fraud: 'invoice-fraud',
    payments: 'invoice-payments',
    actions: 'invoice-actions',
    forecast: 'invoice-forecast',
    insightsTable: 'invoice-insights-table',
} as const;

export function getInvoiceIntelDetailHref(slug: string): string | null {
    if (!getInvoiceIntelBySlug(slug)) return null;
    return `/company-admin/invoices/view/${encodeURIComponent(slug)}`;
}

export function getInvoiceValidationHref(slug: string): string | null {
    if (!getInvoiceIntelBySlug(slug)) return null;
    return `#${INVOICE_INTEL_SECTION_IDS.validation}`;
}
