'use client';

import React, { useMemo } from 'react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import { computeRemainingSlaLabel, computeSlaProgressPercent, getAssignedVendorOptions } from '@/lib/serviceMaintenanceStore';
import type { ServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import { cn } from '@/lib/utils';

export function ServiceMaintenanceAIPanel({ ticket, disabled }: { ticket: ServiceMaintenanceTicket; disabled?: boolean }) {
    const { confidence, bullets, reco, chips, breachRisk, estResolutionHours, vendorPick } = useMemo(() => {
        const gaps: string[] = [];
        if (!ticket.description.trim()) gaps.push('Description missing');
        if (ticket.assignedVendor === 'Unassigned') gaps.push('No vendor assigned');

        let conf = 86;
        if (gaps.length > 0) conf -= gaps.length * 5;
        if (ticket.slaStatus === 'Warning') conf -= 10;
        if (ticket.slaStatus === 'Breached') conf -= 18;
        if (ticket.priorityLevel === 'Critical') conf -= 6;

        const slaLabel = computeRemainingSlaLabel(ticket.slaDueAt, ticket.ticketStatus);
        const progress = computeSlaProgressPercent(ticket.createdAt, ticket.slaDueAt, ticket.ticketStatus);
        const breachRiskPct = ticket.slaStatus === 'Breached' ? 92 : ticket.slaStatus === 'Warning' ? 68 : Math.min(45, progress);

        const vendors = getAssignedVendorOptions().filter((v) => v !== 'Unassigned');
        const vendorPick =
            ticket.assignedVendor !== 'Unassigned'
                ? ticket.assignedVendor
                : vendors.find((v) => v.toLowerCase().includes(ticket.issueCategory.toLowerCase().slice(0, 4))) ?? vendors[0] ?? 'Assign vendor';

        const estResolutionHours = Math.max(2, ticket.resolutionTimeHours - Math.floor(progress / 20));

        const summary: string[] = [];
        const recs: string[] = [];

        if (ticket.slaStatus === 'Breached') {
            summary.push(`SLA breach prediction: ${breachRiskPct}% — ${slaLabel}.`);
            recs.push('Escalate to Level 2+ and page the vendor lead immediately.');
        } else if (ticket.slaStatus === 'Warning') {
            summary.push(`SLA at risk (${breachRiskPct}% breach probability) — ${slaLabel}.`);
            recs.push('Confirm vendor ETA and send resident visit confirmation.');
        } else {
            summary.push(`On track — estimated resolution in ~${estResolutionHours}h.`);
            recs.push('Capture technician notes before marking resolved.');
        }

        if (ticket.priorityLevel === 'Critical' || ticket.priorityLevel === 'High') {
            summary.push(`Issue severity: ${ticket.priorityLevel} ${ticket.issueCategory} — prioritize dispatch queue.`);
        }

        if (ticket.assignedVendor === 'Unassigned') {
            summary.push(`Smart vendor recommendation: ${vendorPick} for ${ticket.issueCategory}.`);
            recs.push('Run auto-assign or manually assign the recommended vendor.');
        }

        summary.push(`Workload signal: ${ticket.escalationLevel} escalation tier active.`);

        const chips = [
            ticket.slaStatus === 'Breached' ? 'SLA breach' : ticket.slaStatus === 'Warning' ? 'SLA warning' : 'On track',
            `${ticket.priorityLevel} priority`,
            ticket.assignedVendor === 'Unassigned' ? 'Needs vendor' : 'Vendor assigned',
            `~${estResolutionHours}h ETA`,
        ];

        return {
            confidence: Math.max(52, Math.min(98, conf)),
            bullets: summary,
            reco: recs[0] ?? 'Review repeat categories for preventive maintenance.',
            chips,
            breachRisk: breachRiskPct,
            estResolutionHours,
            vendorPick,
        };
    }, [ticket]);

    return (
        <AICopilotPanel title="AI Service Copilot">
            <div className="flex flex-wrap gap-1.5">
                {chips.map((c) => (
                    <span
                        key={c}
                        className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            c.includes('breach') ? 'bg-rose-100 text-rose-900' : c.includes('warning') ? 'bg-amber-100 text-amber-950' : 'bg-slate-100 text-slate-800',
                        )}
                    >
                        {c}
                    </span>
                ))}
            </div>
            <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <span>SLA breach risk</span>
                    <span className="tabular-nums text-slate-700">{breachRisk}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                        className={cn('h-full rounded-full transition-all', breachRisk >= 70 ? 'bg-rose-500' : breachRisk >= 45 ? 'bg-amber-500' : 'bg-emerald-500')}
                        style={{ width: `${breachRisk}%` }}
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
                <span className="font-semibold">Recommended vendor:</span> {vendorPick}
            </div>
            <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Quick recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">{disabled ? 'Enable after record is active.' : reco}</p>
            </div>
            <AIConfidenceBar value={confidence} className="mt-3" />
            <p className="mt-2 text-[10px] text-slate-500">Confidence reflects SLA health, severity, vendor coverage, and ticket completeness (demo rules).</p>
        </AICopilotPanel>
    );
}
