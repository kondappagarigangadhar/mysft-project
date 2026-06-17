'use client';

import React, { useMemo } from 'react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import type { Customer } from '@/lib/customersStore';
import type { CustomerWorkspaceTabId } from '@/components/customers/customerDetailTabIds';
import {
    computeCustomerPropertyAiSignals,
    resolveCustomerPropertyContext,
} from '@/lib/customers/customerPropertyIntelligence';
import { cn } from '@/lib/utils';

type TabContext = CustomerWorkspaceTabId | 'default';

function paymentHealthScore(c: Customer): number {
    if (c.totalAmount <= 0) return 50;
    const pct = (c.paidAmount / c.totalAmount) * 100;
    if (c.paymentStatus === 'Paid') return 92;
    if (c.paymentStatus === 'Overdue') return Math.max(35, 60 - Math.round(pct));
    return Math.min(88, 45 + Math.round(pct * 0.4));
}

function ScanMetric({ label, value, tone }: { label: string; value: string; tone?: 'risk' | 'good' | 'neutral' }) {
    const box =
        tone === 'risk'
            ? 'border-rose-200 bg-rose-50/90'
            : tone === 'good'
              ? 'border-emerald-200 bg-emerald-50/90'
              : 'border-slate-200 bg-white/90';
    return (
        <div className={cn('rounded-lg border px-3 py-2', box)}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}

/** Compact AI Buyer Copilot — risk, payment, completion, recommendation, confidence. */
export function CustomerAIPanel({
    customer,
    disabled,
    tabContext = 'default',
}: {
    customer: Customer;
    disabled?: boolean;
    tabContext?: TabContext;
}) {
    const ctx = useMemo(() => resolveCustomerPropertyContext(customer), [customer]);
    const propertyAi = useMemo(() => computeCustomerPropertyAiSignals(customer, ctx), [customer, ctx]);

    const { confidence, reco, riskLabel, paymentHealth, completionPct } = useMemo(() => {
        const health = propertyAi.paymentHealth || paymentHealthScore(customer);
        const overdue = customer.paymentStatus === 'Overdue';
        const partial = customer.paymentStatus === 'Partial';

        let conf = 84;
        const recs: string[] = [];

        if (overdue) {
            recs.push('Send payment link and schedule a callback for the overdue installment.');
            conf -= 12;
        } else if (partial) {
            recs.push('Share the payment link for the next milestone installment.');
            conf -= 4;
        } else if (customer.paymentStatus === 'Paid') {
            recs.push('Buyer is on track — confirm possession timeline and handover checklist.');
        } else {
            recs.push('Maintain payment cadence and keep agreement documents in the buyer vault.');
        }

        if (tabContext === 'documents' && customer.documents.filter((d) => d.type === 'Agreement').length === 0) {
            recs.unshift('Upload the signed agreement to complete the buyer document trail.');
            conf -= 5;
        }

        if (tabContext === 'project-updates' && !customer.projectUpdates.length) {
            recs.unshift('Publish a construction update to strengthen buyer confidence.');
            conf -= 3;
        }

        if (propertyAi.projectRisk === 'High') conf -= 8;
        else if (propertyAi.projectRisk === 'Medium') conf -= 4;

        const riskLabel =
            propertyAi.projectRisk === 'High' ? 'High' : propertyAi.projectRisk === 'Medium' ? 'Medium' : overdue ? 'High' : partial ? 'Medium' : 'Low';

        return {
            confidence: Math.max(52, Math.min(98, conf)),
            reco: disabled ? 'Save the customer record to enable insights.' : recs[0]!,
            riskLabel,
            paymentHealth: health,
            completionPct: propertyAi.completionPrediction,
        };
    }, [customer, tabContext, propertyAi, disabled]);

    const riskTone = riskLabel === 'High' ? 'risk' : riskLabel === 'Medium' ? 'neutral' : 'good';

    return (
        <AICopilotPanel title="AI Buyer Copilot">
            <div className="space-y-2">
                <ScanMetric label="Risk" value={riskLabel} tone={riskTone} />
                <ScanMetric label="Payment health" value={`${paymentHealth}%`} tone={paymentHealth >= 70 ? 'good' : 'neutral'} />
                <ScanMetric label="Completion estimate" value={`${completionPct}%`} tone="neutral" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recommendation</p>
                <p className="mt-1 text-sm font-medium text-slate-800 leading-relaxed">{reco}</p>
            </div>
            <AIConfidenceBar value={confidence} />
        </AICopilotPanel>
    );
}
