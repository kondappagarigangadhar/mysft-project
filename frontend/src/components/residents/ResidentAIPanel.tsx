'use client';

import React, { useMemo } from 'react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import type { Resident } from '@/lib/residentStore';

function daysUntilExpiry(ymd: string): number | null {
    if (!/^\d{4}-\d{2}-\d{2}/.test(ymd.slice(0, 10))) return null;
    const t = Date.parse(`${ymd.slice(0, 10)}T12:00:00.000Z`);
    if (Number.isNaN(t)) return null;
    return Math.ceil((t - Date.now()) / 86400000);
}

function noticeEngagementScore(resident: Resident): number {
    const active = resident.notices.filter((n) => {
        const exp = Date.parse(n.expiryDate.length <= 10 ? `${n.expiryDate}T23:59` : n.expiryDate);
        return !Number.isNaN(exp) && exp >= Date.now();
    });
    if (!active.length) return 42;
    const push = active.filter((n) => n.sendPushNotification).length;
    return Math.min(95, 55 + active.length * 8 + push * 6);
}

type TabContext = 'overview' | 'notices' | 'records' | 'default';

/** Rule-based contextual guidance (offline-first) matching Leads-style AI chrome. */
export function ResidentAIPanel({
    resident,
    disabled,
    tabContext = 'default',
}: {
    resident: Resident;
    disabled?: boolean;
    tabContext?: TabContext;
}) {
    const { confidence, bullets, reco } = useMemo(() => {
        const incompleteness: string[] = [];
        if (!resident.email.trim()) incompleteness.push('Email missing');
        if (!resident.phoneNumber.trim()) incompleteness.push('Phone missing');
        if (!resident.identityDocument && !resident.portalAccessEnabled) incompleteness.push('Identity doc not uploaded');
        if (!resident.emergencyContactNumber.trim()) incompleteness.push('Emergency contact missing');

        let conf = 86;
        if (incompleteness.length > 1) conf -= 14;
        if (resident.residentStatus !== 'Active') conf -= 8;

        const accessDays = daysUntilExpiry(resident.accessExpiryDate);
        const expiredAccess = accessDays !== null && accessDays < 0;
        const expiringSoon = accessDays !== null && accessDays >= 0 && accessDays <= 30;

        const inactive = resident.residentStatus === 'Inactive' || resident.residentStatus === 'Vacated';
        const rec = resident.communityRecord;
        const vacantUnit = rec.occupancyStatus === 'Vacant';
        const activeNotices = resident.notices.filter((n) => {
            const exp = Date.parse(n.expiryDate.length <= 10 ? `${n.expiryDate}T23:59` : n.expiryDate);
            return !Number.isNaN(exp) && exp >= Date.now();
        });
        const engagement = noticeEngagementScore(resident);

        const summaryLines: string[] = [];
        const recs: string[] = [];

        if (tabContext === 'notices' || tabContext === 'default') {
            if (activeNotices.length === 0) {
                summaryLines.push('No active notices — residents may miss important updates.');
                recs.push('Publish a General notice with push enabled for high visibility.');
            } else {
                summaryLines.push(`${activeNotices.length} active notice(s); predicted engagement ~${engagement}%.`);
                if (activeNotices.some((n) => n.category === 'Emergency')) {
                    recs.push('Emergency notice live — confirm push delivery and monitor read rates.');
                } else {
                    recs.push('Schedule follow-up announcement before expiry to sustain engagement.');
                }
            }
        }

        if (tabContext === 'records' || tabContext === 'default') {
            if (vacantUnit) {
                summaryLines.push('Occupancy alert: unit marked Vacant — verify move-out workflow.');
                recs.push('Update occupancy to Occupied when a new resident is onboarded.');
                conf -= 6;
            } else {
                summaryLines.push(`Unit ${rec.unitNumber} is Occupied (${rec.occupancyType}).`);
            }
            if (inactive) {
                summaryLines.push('Inactive resident profile — engagement may be low.');
                recs.push('Send a re-engagement notice to Owners/Tenants audience segments.');
            }
            if (rec.tags.includes('Defaulter')) {
                summaryLines.push('Defaulter tag detected — prioritize payment or compliance outreach.');
                conf -= 5;
            }
            if (rec.timelineLogs.length < 2) {
                recs.push('Add move-in / move-out logs to complete the resident timeline.');
            }
        }

        if (tabContext === 'overview' || tabContext === 'default') {
            if (incompleteness.length > 0) {
                summaryLines.push(`Incomplete profile: ${incompleteness.slice(0, 3).join(', ')}.`);
                conf -= 6;
                recs.push(`Complete onboarding fields: ${incompleteness[0]?.toLowerCase() ?? ''}.`);
            }
            if (expiredAccess) {
                summaryLines.push('Portal access appears expired.');
                conf -= 10;
                recs.push('Renew access expiry or revoke credentials until documents are validated.');
            } else if (expiringSoon) {
                summaryLines.push(`Portal access expires in ${accessDays} day(s).`);
                recs.push('Send renewal reminder ahead of cutoff to avoid resident lock-outs.');
            }
            if (!resident.portalAccessEnabled) {
                summaryLines.push('Portal access disabled — engagement may stall.');
                recs.push('Enable portal once identity verification is cleared.');
                conf -= 4;
            }
        }

        if (summaryLines.length === 0) {
            summaryLines.push('Profile looks consistent for an active community member.');
            recs.push('Schedule a quick welcome check-in to confirm unit satisfaction.');
        }

        return {
            confidence: Math.max(52, Math.min(98, conf)),
            bullets: summaryLines.slice(0, 4),
            reco: recs[0] ?? 'Keep documents, notices, and access renewals on a quarterly review.',
        };
    }, [resident, tabContext]);

    return (
        <AICopilotPanel title="AI Community Copilot">
            <div className="space-y-2">
                {bullets.map((b, i) => (
                    <div key={i} className="rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-800 leading-relaxed">
                        {b}
                    </div>
                ))}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Quick recommendation</p>
                <p className="mt-1 text-slate-800 leading-relaxed">{disabled ? 'Enable after record is active.' : reco}</p>
            </div>
            <AIConfidenceBar value={confidence} />
            <p className="text-[10px] text-slate-500">
                Confidence reflects profile completeness, occupancy, notice engagement, and access signals (demo rules).
            </p>
        </AICopilotPanel>
    );
}
