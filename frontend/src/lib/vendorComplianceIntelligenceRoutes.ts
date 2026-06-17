import { getVendorComplianceBySlug } from './vendorComplianceIntelligenceStore';

export const VENDOR_COMPLIANCE_SECTION_IDS = {
    attention: 'vendor-compliance-attention',
    health: 'vendor-compliance-health',
    registry: 'vendor-compliance-registry',
    kyc: 'vendor-compliance-kyc',
    validation: 'vendor-compliance-validation',
    risk: 'vendor-compliance-risk',
    expiry: 'vendor-compliance-expiry',
    actions: 'vendor-compliance-actions',
    forecast: 'vendor-compliance-forecast',
    category: 'vendor-compliance-category',
    insightsTable: 'vendor-compliance-insights-table',
} as const;

export function getVendorComplianceDetailHref(slug: string): string | null {
    if (!getVendorComplianceBySlug(slug)) return null;
    return `/company-admin/vendors/compliance?vendor=${encodeURIComponent(slug)}`;
}

export function getVendorKycHref(slug: string): string | null {
    if (!getVendorComplianceBySlug(slug)) return null;
    return `#${VENDOR_COMPLIANCE_SECTION_IDS.kyc}`;
}

export function getVendorExpiryHref(slug: string): string | null {
    if (!getVendorComplianceBySlug(slug)) return null;
    return `#${VENDOR_COMPLIANCE_SECTION_IDS.expiry}`;
}
