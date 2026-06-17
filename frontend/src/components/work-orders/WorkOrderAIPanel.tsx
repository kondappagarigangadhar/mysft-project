'use client';

import React, { useMemo } from 'react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import { computeDelayDays, type WorkOrder } from '@/lib/workOrderStore';
import { cn } from '@/lib/utils';

type OverviewDraftSlice = {
    title: string;
    vendorName: string;
    projectOrProperty: string;
    slaStatus: string;
    status: string;
    priority: string;
    endDate: string;
};

/** Rule-based vendor assignment copilot — aligned with Service Maintenance & Resident panels. */
export function WorkOrderAIPanel({
    workOrder,
    draft,
    disabled,
}: {
    workOrder: WorkOrder;
    draft: OverviewDraftSlice;
    disabled?: boolean;
}) {
    const { confidence, bullets, reco, chips, progressPct, slaRiskPct } = useMemo(() => {
        const vendor = draft.vendorName?.trim() || workOrder.vendor?.vendorName?.trim() || '';
        const status = draft.status || workOrder.lifecycle?.status || 'Draft';
        const sla = draft.slaStatus || workOrder.scheduling?.slaStatus || 'On Track';
        const priority = draft.priority || workOrder.priority || 'Medium';
        const endDate = draft.endDate || workOrder.scheduling?.endDate || '';

        const updates = workOrder.progressUpdates ?? [];
        const latestPct = updates.length ? [...updates].sort((a, b) => (a.at < b.at ? 1 : -1))[0]!.completionPct : 0;

        const delayDays = computeDelayDays(workOrder.scheduling?.startDate ?? '', endDate);
        const todayYmd = new Date().toISOString().slice(0, 10);
        const pastDue = Boolean(endDate && endDate < todayYmd && status !== 'Completed' && status !== 'Verified' && status !== 'Cancelled');

        let conf = 88;
        const gaps: string[] = [];
        if (!vendor) gaps.push('Vendor not assigned');
        if (!draft.title?.trim() && !workOrder.title?.trim()) gaps.push('Title missing');
        if (!endDate) gaps.push('End date missing');
        conf -= gaps.length * 6;

        if (sla === 'At Risk') conf -= 8;
        if (sla === 'Delayed' || pastDue) conf -= 14;
        if (priority === 'Critical') conf -= 4;
        if (status === 'On Hold') conf -= 6;

        let slaRisk = sla === 'Delayed' || pastDue ? 78 : sla === 'At Risk' ? 52 : 24;
        if (status === 'Completed' || status === 'Verified') slaRisk = Math.min(slaRisk, 12);

        const summary: string[] = [];
        const recs: string[] = [];

        if (pastDue || sla === 'Delayed') {
            summary.push(`SLA breach risk elevated (${slaRisk}%) — due date ${pastDue ? 'passed' : 'at risk'}.`);
            recs.push('Escalate to ops lead and confirm vendor ETA for recovery plan.');
        } else if (sla === 'At Risk') {
            summary.push(`Schedule pressure detected — monitor vendor throughput on ${priority.toLowerCase()} priority work.`);
            recs.push('Request a progress update with photos before the due date.');
        } else {
            summary.push(`Execution on track at ${latestPct}% completion.`);
            recs.push('Capture the next milestone update with site photos.');
        }

        if (!vendor) {
            summary.push('No vendor assigned — assignment is blocking execution.');
            recs.push('Assign a vendor from the registry and notify them.');
        } else if (status === 'Assigned' || status === 'Open') {
            summary.push(`Vendor ${vendor} is assigned — confirm mobilization for ${draft.projectOrProperty || workOrder.projectOrProperty || 'the site'}.`);
        }

        const verification = workOrder.completion?.verificationStatus;
        if (status === 'Completed' && verification !== 'Approved') {
            summary.push('Work marked complete — verification pending ops review.');
            recs.push('Complete verification with remarks before releasing payment.');
        } else if (verification === 'Rework Needed') {
            summary.push('Verification flagged rework — vendor must resubmit completion proof.');
            recs.push('Log a progress note describing rework scope and new ETA.');
        }

        if (workOrder.finance?.paymentStatus === 'Pending' && (status === 'Verified' || verification === 'Approved')) {
            summary.push('Payment release candidate — invoice reference can be linked.');
        }

        const chips = [
            sla === 'Delayed' || pastDue ? 'SLA risk' : sla === 'At Risk' ? 'At risk' : 'On track',
            `${priority} priority`,
            vendor ? 'Vendor set' : 'Needs vendor',
            `${latestPct}% done`,
        ];

        return {
            confidence: Math.max(50, Math.min(98, conf)),
            bullets: summary.slice(0, 4),
            reco: recs[0] ?? 'Review vendor workload before assigning follow-on tasks.',
            chips,
            progressPct: latestPct,
            slaRiskPct: slaRisk,
        };
    }, [draft, workOrder]);

    return (
        <AICopilotPanel title="AI Vendor Assignment Copilot">
            <div className="flex flex-wrap gap-1.5">
                {chips.map((c) => (
                    <span
                        key={c}
                        className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            c.includes('risk') || c.includes('At risk')
                                ? 'bg-amber-100 text-amber-950'
                                : c.includes('Needs')
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-slate-100 text-slate-800',
                        )}
                    >
                        {c}
                    </span>
                ))}
            </div>

            <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <span>SLA breach risk</span>
                    <span className="tabular-nums text-slate-700">{slaRiskPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all',
                            slaRiskPct >= 70 ? 'bg-rose-500' : slaRiskPct >= 45 ? 'bg-amber-500' : 'bg-emerald-500',
                        )}
                        style={{ width: `${slaRiskPct}%` }}
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
                <span className="font-semibold">Progress signal:</span> {progressPct}% complete
                {workOrder.progressUpdates?.length ? ` · ${workOrder.progressUpdates.length} update(s) logged` : ' · no vendor updates yet'}
            </div>

            <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Quick recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">{disabled ? 'Available after the record is saved.' : reco}</p>
            </div>

            <AIConfidenceBar value={confidence} className="mt-3" />
            <p className="mt-2 text-[10px] text-slate-500">Confidence reflects SLA health, vendor coverage, progress cadence, and record completeness (demo rules).</p>
        </AICopilotPanel>
    );
}
