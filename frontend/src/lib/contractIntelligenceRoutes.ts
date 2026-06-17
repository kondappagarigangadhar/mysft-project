import { getContractBySlug } from './contractIntelligenceStore';

export const CONTRACT_SECTION_IDS = {
    attention: 'contract-attention',
    repository: 'contract-repository',
    review: 'contract-review',
    comparison: 'contract-comparison',
    renewal: 'contract-renewal',
    clauses: 'contract-clauses',
    actions: 'contract-actions',
    forecast: 'contract-forecast',
    insightsTable: 'contract-insights-table',
} as const;

export function getContractDetailHref(slug: string): string | null {
    if (!getContractBySlug(slug)) return null;
    return `/company-admin/documents-compliance/view/${encodeURIComponent(slug)}`;
}

export function getContractCompareHref(slugA: string, slugB?: string): string | null {
    if (!getContractBySlug(slugA)) return null;
    const base = `/company-admin/documents-compliance/contract-intelligence?compare=${encodeURIComponent(slugA)}`;
    if (slugB && getContractBySlug(slugB)) {
        return `${base}&with=${encodeURIComponent(slugB)}`;
    }
    return `${base}#${CONTRACT_SECTION_IDS.comparison}`;
}

export function getContractReviewHref(slug: string): string | null {
    if (!getContractBySlug(slug)) return null;
    return `#${CONTRACT_SECTION_IDS.review}`;
}

export function getContractActionHref(slug: string): string | null {
    return getContractDetailHref(slug) ?? `#${CONTRACT_SECTION_IDS.actions}`;
}

export function getVendorContractsHref(vendorSlug: string): string {
    return `/company-admin/vendors/contracts?vendor=${encodeURIComponent(vendorSlug)}`;
}
