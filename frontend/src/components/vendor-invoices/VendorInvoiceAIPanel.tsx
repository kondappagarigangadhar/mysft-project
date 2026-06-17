'use client';

import React, { useMemo } from 'react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import {
    computeBillingTotals,
    computeVendorInvoiceAiSignals,
    type VendorInvoiceOverviewDraft,
} from '@/lib/vendor-invoices/vendorInvoiceWorkOrderBridge';
import { hasDuplicateVendorInvoiceForWorkOrder, type VendorInvoice } from '@/lib/vendorInvoiceStore';
import { cn } from '@/lib/utils';

export function VendorInvoiceAIPanel({
    invoice,
    draft,
    workOrderValue,
    disabled,
    excludeSlug,
    vendorDetailsOverride,
}: {
    invoice: VendorInvoice;
    draft: VendorInvoiceOverviewDraft;
    workOrderValue: number;
    disabled?: boolean;
    excludeSlug?: string;
    vendorDetailsOverride?: VendorInvoice['vendorDetails'];
}) {
    const { confidence, bullets, reco, chips, variancePct, riskPct } = useMemo(() => {
        const discount = Number(draft.discount) || 0;
        const gst = Number(draft.gstPercent) || 18;
        const { invoiceAmount } = computeBillingTotals(draft.lineItems, discount, gst);

        const details = vendorDetailsOverride ?? invoice.vendorDetails;
        const vendorCompliance = details?.complianceStatus || 'Pending';
        const vendorContract = details?.contractStatus || 'Draft';
        const hasMandatoryDocs = (invoice.attachments?.length ?? 0) > 0;
        const woId = draft.linkedWorkOrderId?.trim() || invoice.linkedWorkOrderId?.trim() || '';
        const duplicate = woId ? hasDuplicateVendorInvoiceForWorkOrder(woId, excludeSlug) : false;

        const signals = computeVendorInvoiceAiSignals({
            invoiceTotal: invoiceAmount || invoice.invoiceAmount,
            workOrderValue: workOrderValue || invoice.workOrderRef?.workOrderValue || invoice.aiValidation.workOrderApprovedAmount,
            approvedAmount: invoice.approvedAmount,
            vendorCompliance,
            vendorContract,
            vendorRiskScore: invoice.aiValidation?.riskScore ?? 30,
            hasDuplicateForWorkOrder: duplicate,
            hasMandatoryDocuments: hasMandatoryDocs,
            currency: draft.currency || invoice.currency,
        });

        return {
            confidence: signals.confidence,
            bullets: signals.bullets,
            reco: signals.recommendation,
            chips: signals.chips,
            variancePct: signals.variancePercent,
            riskPct: signals.validation.riskScore ?? 30,
        };
    }, [draft, invoice, workOrderValue, excludeSlug, vendorDetailsOverride]);

    return (
        <AICopilotPanel title="AI Invoice Intelligence">
            <div className="flex flex-wrap gap-1.5">
                {chips.map((c) => (
                    <span
                        key={c}
                        className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            c.includes('High Variance') || c.includes('Duplicate') || c.includes('Compliance') || c.includes('Contract') || c.includes('Missing')
                                ? 'bg-rose-100 text-rose-900'
                                : c.includes('Needs Review')
                                  ? 'bg-amber-100 text-amber-950'
                                  : 'bg-emerald-100 text-emerald-900',
                        )}
                    >
                        {c}
                    </span>
                ))}
            </div>

            <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <span>Variance vs work order</span>
                    <span className="tabular-nums text-slate-700">{variancePct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all',
                            variancePct >= 15 ? 'bg-rose-500' : variancePct >= 8 ? 'bg-amber-500' : 'bg-emerald-500',
                        )}
                        style={{ width: `${Math.min(100, Math.max(variancePct, 4))}%` }}
                    />
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {bullets.map((b, i) => (
                    <div key={i} className="rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium leading-relaxed text-slate-800">
                        {b}
                    </div>
                ))}
            </div>

            <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_15%,white)] bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)] px-3 py-2 text-xs text-slate-800">
                <span className="font-semibold">Risk score:</span> {riskPct}% · Validates amount vs WO value, approved amount, vendor compliance, contract, documents, and duplicates.
            </div>

            <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Quick recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">{disabled ? 'Available after work order is linked and invoice is saved.' : reco}</p>
            </div>

            <AIConfidenceBar value={confidence} className="mt-3" />
        </AICopilotPanel>
    );
}
