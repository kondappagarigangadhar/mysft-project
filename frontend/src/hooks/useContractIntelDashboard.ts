'use client';

import { useMemo } from 'react';
import { filterContracts, filterRenewals, type ContractIntelFilters } from '@/lib/contractIntelligenceHelpers';
import {
    getClauseLibrary,
    getContractAttentionItems,
    getContractComparisonHighlights,
    getContractExecutiveKpis,
    getContractExtractionSample,
    getContractForecasts,
    getContractRecommendedActions,
    getContractRecords,
    getContractRenewals,
    getContractRepositorySnapshot,
    getRenewalTrackerCounts,
} from '@/lib/contractIntelligenceStore';

const ATTENTION_LIMIT = 8;
const ACTIONS_LIMIT = 6;

export function useContractIntelDashboard(filters: ContractIntelFilters) {
    const allContracts = useMemo(() => getContractRecords(), []);
    const contracts = useMemo(() => filterContracts(allContracts, filters), [allContracts, filters]);
    const contractSlugs = useMemo(() => new Set(contracts.map((c) => c.slug)), [contracts]);

    const executive = useMemo(() => getContractExecutiveKpis(), []);
    const repositorySnapshot = useMemo(() => getContractRepositorySnapshot(), []);

    const attention = useMemo(() => {
        const items = getContractAttentionItems().filter((a) => contractSlugs.has(a.contractSlug));
        return items.slice(0, ATTENTION_LIMIT);
    }, [contractSlugs]);

    const renewals = useMemo(() => filterRenewals(getContractRenewals(), contractSlugs), [contractSlugs]);

    const actions = useMemo(() => {
        return getContractRecommendedActions()
            .filter((a) => contractSlugs.has(a.contractSlug))
            .slice(0, ACTIONS_LIMIT);
    }, [contractSlugs]);

    const forecasts = useMemo(() => getContractForecasts(), []);
    const clauses = useMemo(() => getClauseLibrary(), []);
    const comparisonHighlights = useMemo(() => getContractComparisonHighlights(), []);
    const extractionSample = useMemo(() => getContractExtractionSample(), []);
    const renewalCounts = useMemo(() => getRenewalTrackerCounts(), []);

    const rankedContracts = useMemo(
        () => [...contracts].sort((a, b) => b.riskScore - a.riskScore),
        [contracts],
    );

    return {
        executive,
        repositorySnapshot,
        attention,
        contracts,
        rankedContracts,
        renewals,
        actions,
        forecasts,
        clauses,
        comparisonHighlights,
        extractionSample,
        renewalCounts,
        contractCount: contracts.length,
        allContractCount: allContracts.length,
    };
}

export type ContractIntelDashboard = ReturnType<typeof useContractIntelDashboard>;
