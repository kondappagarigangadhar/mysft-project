'use client';

import { useMemo } from 'react';
import { filterVendors, type VendorComplianceIntelFilters } from '@/lib/vendorComplianceIntelligenceHelpers';
import {
    getVendorCategoryPerformance,
    getVendorComplianceAttentionItems,
    getVendorComplianceExecutiveKpis,
    getVendorComplianceForecasts,
    getVendorComplianceHealthSnapshot,
    getVendorComplianceRecommendedActions,
    getVendorComplianceRecords,
    getVendorExpiryCounts,
    getVendorExpiryRows,
    getVendorHighRiskRows,
    getVendorKycProfile,
    getVendorRiskFactors,
    getVendorValidationFindings,
} from '@/lib/vendorComplianceIntelligenceStore';

const ATTENTION_LIMIT = 8;
const ACTIONS_LIMIT = 6;

export function useVendorComplianceIntelDashboard(filters: VendorComplianceIntelFilters) {
    const allVendors = useMemo(() => getVendorComplianceRecords(), []);
    const vendors = useMemo(() => filterVendors(allVendors, filters), [allVendors, filters]);
    const vendorSlugs = useMemo(() => new Set(vendors.map((v) => v.slug)), [vendors]);

    const executive = useMemo(() => getVendorComplianceExecutiveKpis(), []);
    const healthSnapshot = useMemo(() => getVendorComplianceHealthSnapshot(), []);

    const attention = useMemo(() => {
        return getVendorComplianceAttentionItems()
            .filter((a) => vendorSlugs.has(a.vendorSlug))
            .slice(0, ATTENTION_LIMIT);
    }, [vendorSlugs]);

    const actions = useMemo(() => {
        return getVendorComplianceRecommendedActions()
            .filter((a) => vendorSlugs.has(a.vendorSlug))
            .slice(0, ACTIONS_LIMIT);
    }, [vendorSlugs]);

    const expiries = useMemo(() => {
        return getVendorExpiryRows().filter((e) => vendorSlugs.has(e.vendorSlug));
    }, [vendorSlugs]);

    const highRiskVendors = useMemo(() => {
        return getVendorHighRiskRows().filter((v) => vendorSlugs.has(v.vendorSlug));
    }, [vendorSlugs]);

    const kycProfile = useMemo(() => getVendorKycProfile(), []);
    const validationFindings = useMemo(() => getVendorValidationFindings(), []);
    const riskFactors = useMemo(() => getVendorRiskFactors(), []);
    const expiryCounts = useMemo(() => getVendorExpiryCounts(), []);
    const forecasts = useMemo(() => getVendorComplianceForecasts(), []);
    const categoryPerformance = useMemo(() => getVendorCategoryPerformance(), []);

    const rankedVendors = useMemo(
        () => [...vendors].sort((a, b) => b.riskScore - a.riskScore),
        [vendors],
    );

    const sampleRiskScore = useMemo(() => {
        const top = rankedVendors.find((v) => v.riskLevel === 'High') ?? rankedVendors[0];
        return top?.riskScore ?? 85;
    }, [rankedVendors]);

    return {
        executive,
        healthSnapshot,
        attention,
        vendors,
        rankedVendors,
        actions,
        expiries,
        highRiskVendors,
        kycProfile,
        validationFindings,
        riskFactors,
        expiryCounts,
        forecasts,
        categoryPerformance,
        sampleRiskScore,
        vendorCount: vendors.length,
        allVendorCount: allVendors.length,
    };
}

export type VendorComplianceIntelDashboard = ReturnType<typeof useVendorComplianceIntelDashboard>;
