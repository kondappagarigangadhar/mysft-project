'use client';

import { useMemo } from 'react';
import { filterInvoices, type InvoiceIntelFilters } from '@/lib/invoiceIntelligenceHelpers';
import {
    getDuplicateSuspects,
    getFraudAlerts,
    getFraudRiskCategories,
    getInvoiceAttentionItems,
    getInvoiceExtractionSample,
    getInvoiceForecasts,
    getInvoiceHealthSnapshot,
    getInvoiceIntelExecutiveKpis,
    getInvoiceIntelRecords,
    getInvoiceRecommendedActions,
    getPaymentDueRows,
    getPaymentTrackerCounts,
    getPoMatchHighlights,
} from '@/lib/invoiceIntelligenceStore';

const ATTENTION_LIMIT = 8;
const ACTIONS_LIMIT = 6;

export function useInvoiceIntelDashboard(filters: InvoiceIntelFilters) {
    const allInvoices = useMemo(() => getInvoiceIntelRecords(), []);
    const invoices = useMemo(() => filterInvoices(allInvoices, filters), [allInvoices, filters]);
    const invoiceSlugs = useMemo(() => new Set(invoices.map((i) => i.slug)), [invoices]);

    const executive = useMemo(() => getInvoiceIntelExecutiveKpis(), []);
    const healthSnapshot = useMemo(() => getInvoiceHealthSnapshot(), []);

    const attention = useMemo(() => {
        return getInvoiceAttentionItems()
            .filter((a) => invoiceSlugs.has(a.invoiceSlug))
            .slice(0, ATTENTION_LIMIT);
    }, [invoiceSlugs]);

    const actions = useMemo(() => {
        return getInvoiceRecommendedActions()
            .filter((a) => invoiceSlugs.has(a.invoiceSlug))
            .slice(0, ACTIONS_LIMIT);
    }, [invoiceSlugs]);

    const poMatches = useMemo(() => {
        const numbers = new Set(invoices.map((i) => i.invoiceNumber));
        return getPoMatchHighlights().filter((m) => numbers.has(m.invoiceNumber));
    }, [invoices]);

    const duplicates = useMemo(() => {
        return getDuplicateSuspects().filter((d) => invoiceSlugs.has(d.invoiceSlug));
    }, [invoiceSlugs]);

    const fraudAlerts = useMemo(() => {
        return getFraudAlerts().filter((f) => invoiceSlugs.has(f.invoiceSlug));
    }, [invoiceSlugs]);

    const payments = useMemo(() => {
        return getPaymentDueRows().filter((p) => invoiceSlugs.has(p.invoiceSlug));
    }, [invoiceSlugs]);

    const extractionSample = useMemo(() => getInvoiceExtractionSample(), []);
    const fraudCategories = useMemo(() => getFraudRiskCategories(), []);
    const paymentCounts = useMemo(() => getPaymentTrackerCounts(), []);
    const forecasts = useMemo(() => getInvoiceForecasts(), []);

    const rankedInvoices = useMemo(
        () => [...invoices].sort((a, b) => b.riskScore - a.riskScore),
        [invoices],
    );

    const sampleFraudScore = useMemo(() => {
        const top = rankedInvoices.find((i) => i.riskLevel === 'High') ?? rankedInvoices[0];
        return top?.riskScore ?? 82;
    }, [rankedInvoices]);

    return {
        executive,
        healthSnapshot,
        attention,
        invoices,
        rankedInvoices,
        actions,
        poMatches,
        duplicates,
        fraudAlerts,
        payments,
        extractionSample,
        fraudCategories,
        paymentCounts,
        forecasts,
        sampleFraudScore,
        invoiceCount: invoices.length,
        allInvoiceCount: allInvoices.length,
    };
}

export type InvoiceIntelDashboard = ReturnType<typeof useInvoiceIntelDashboard>;
