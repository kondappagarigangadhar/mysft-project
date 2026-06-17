'use client';

import React, { useMemo, useState } from 'react';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import StatusBadge from '@/components/ui/StatusBadge';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import { ResidentCard } from '@/modules/resident-portal/components/ResidentCard';
import {
    ResidentPageHeader,
    ResidentPageShell,
    residentTagClass,
} from '@/modules/resident-portal/components/ResidentPageShell';
import type { MaintenanceTicket } from '@/modules/resident-portal/utils/types';
import { getMockTickets } from '@/modules/resident-portal/services/mockResidentData';
import {
    MaintenanceRequestFormModal,
    MaintenanceTicketConfirmModal,
    MaintenanceTimeline,
} from '@/modules/resident-portal/maintenance';
import type { MaintenanceRequestFormValues } from '@/modules/resident-portal/maintenance';
import { routeMaintenanceIssue } from '@/modules/resident-portal/maintenance/routingEngine';
import { computeSlaStatus } from '@/modules/resident-portal/maintenance/sla';
import { nowIso, formatShortDate, formatTime } from '@/modules/resident-portal/utils/date';
import { cn } from '@/lib/utils';
import { LuPlus, LuStar, LuTrash2, LuWrench } from 'react-icons/lu';

function makeId() {
    return `REQ-${Math.floor(10000 + Math.random() * 89999)}`;
}

export default function ResidentMaintenancePage() {
    const seed = useMemo(() => getMockTickets(), []);
    const [tickets, setTickets] = useState<MaintenanceTicket[]>(seed);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<MaintenanceTicket | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

    const openCount = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length;

    const handleSubmit = (values: MaintenanceRequestFormValues) => {
        setIsSubmitting(true);

        setTimeout(() => {
            const decision = routeMaintenanceIssue({ category: values.category, priority: values.priority });
            const createdAt = nowIso();
            const id = makeId();
            const next: MaintenanceTicket = {
                id,
                createdAt,
                category: values.category,
                description: values.description,
                priority: values.priority,
                preferredVisitWindow: values.preferredVisitWindow,
                attachments: values.attachmentName ? [{ name: values.attachmentName }] : undefined,
                assignedTeam: decision.team,
                assignedVendorName: decision.vendorName,
                status: 'SLA Started',
                eta: values.priority === 'Critical' ? '2 hours' : values.priority === 'High' ? '4 hours' : 'Today',
                sla: { startedAt: createdAt, targetMinutes: decision.slaTargetMinutes, breached: false },
                updates: [
                    { id: 'u1', at: createdAt, by: 'System', message: 'Issue raised successfully.', status: 'Raised' },
                    {
                        id: 'u2',
                        at: createdAt,
                        by: 'System',
                        message: `Vendor assigned: ${decision.vendorName}`,
                        status: 'Vendor Assigned',
                    },
                    { id: 'u3', at: createdAt, by: 'System', message: 'SLA timer started.', status: 'SLA Started' },
                ],
            };

            setTickets((t) => [next, ...t]);
            setIsSubmitting(false);
            setFormOpen(false);
            setToast({ message: 'Maintenance request submitted.', variant: 'success' });
        }, 700);
    };

    return (
        <ResidentPageShell>
            <ResidentPageHeader
                icon={<LuWrench className="h-5 w-5" aria-hidden />}
                title="Maintenance requests"
                subtitle="Raise a complaint, track vendor assignment, and see SLA updates in real time."
            >
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className={residentTagClass}>{openCount} open</span>
                    <span className={residentTagClass}>Auto vendor routing</span>
                </div>
            </ResidentPageHeader>

            <SectionCard
                title="Your tickets"
                subtitle={`${tickets.length} total · ${openCount} open`}
                accent="blue"
                icon={<LuWrench className="h-4 w-4" />}
                bodyClassName="divide-y divide-[#ebebeb] p-0"
                action={
                    <button
                        type="button"
                        onClick={() => setFormOpen(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0a66c2] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#004182]"
                    >
                        <LuPlus className="h-3.5 w-3.5" aria-hidden />
                        Raise request
                    </button>
                }
            >
                {tickets.length === 0 ? (
                    <div className="px-4 py-10 text-center sm:px-5">
                        <p className="text-sm text-[rgba(0,0,0,0.6)]">No requests yet.</p>
                        <button
                            type="button"
                            onClick={() => setFormOpen(true)}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a66c2] hover:underline"
                        >
                            <LuPlus className="h-4 w-4" aria-hidden />
                            Raise your first request
                        </button>
                    </div>
                ) : (
                    <ul>
                        {tickets.map((t) => {
                            const sla = computeSlaStatus({
                                startedAt: t.sla.startedAt,
                                targetMinutes: t.sla.targetMinutes,
                            });
                            const breached = sla.breached;

                            return (
                                <li key={t.id} className="px-4 py-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{t.category}</h3>
                                                <span
                                                    className={cn(
                                                        'rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                                        t.priority === 'Critical'
                                                            ? 'bg-[#fde7e9] text-[#cc1016]'
                                                            : t.priority === 'High'
                                                              ? 'bg-[#fff4e5] text-[#915907]'
                                                              : residentTagClass,
                                                    )}
                                                >
                                                    {t.priority}
                                                </span>
                                            </div>
                                            <p className="mt-1.5 text-sm leading-relaxed text-[rgba(0,0,0,0.6)]">{t.description}</p>
                                            {t.preferredVisitWindow ? (
                                                <p className="mt-1 text-xs text-[rgba(0,0,0,0.5)]">
                                                    Preferred: {t.preferredVisitWindow}
                                                </p>
                                            ) : null}
                                            <p className="mt-2 text-[11px] text-[rgba(0,0,0,0.45)]">
                                                <span className="font-medium text-[rgba(0,0,0,0.75)]">{t.id}</span>
                                                {' · '}
                                                {formatShortDate(t.createdAt)} {formatTime(t.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <StatusBadge status={t.status} />
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(t)}
                                                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 transition hover:border-rose-400"
                                            >
                                                <LuTrash2 className="h-3 w-3" aria-hidden />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <ResidentCard padding="sm" className="mt-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgba(0,0,0,0.6)]">
                                            Progress
                                        </p>
                                        <div className="mt-2.5">
                                            <MaintenanceTimeline status={t.status} />
                                        </div>
                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                            <span className={residentTagClass}>{t.assignedVendorName ?? 'Assigning vendor…'}</span>
                                            <span
                                                className={cn(
                                                    'rounded-sm px-2 py-0.5 text-[11px] font-medium',
                                                    breached ? 'bg-[#fde7e9] text-[#cc1016]' : 'bg-[#e7f3e8] text-[#057642]',
                                                )}
                                            >
                                                SLA {Math.max(0, sla.remainingMinutes)}m left
                                            </span>
                                            {t.eta ? <span className={residentTagClass}>ETA {t.eta}</span> : null}
                                        </div>
                                    </ResidentCard>

                                    {t.updates.length > 0 ? (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-[rgba(0,0,0,0.9)]">Recent updates</p>
                                            <ul className="mt-2 space-y-1.5">
                                                {t.updates.slice(0, 3).map((u) => (
                                                    <li
                                                        key={u.id}
                                                        className="flex gap-3 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-2"
                                                    >
                                                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a66c2]" aria-hidden />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-[11px] font-semibold text-[rgba(0,0,0,0.75)]">
                                                                    {u.by}
                                                                </span>
                                                                <span className="text-[10px] text-[rgba(0,0,0,0.45)]">
                                                                    {formatTime(u.at)}
                                                                </span>
                                                            </div>
                                                            <p className="mt-0.5 text-xs leading-snug text-[rgba(0,0,0,0.6)]">
                                                                {u.message}
                                                            </p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}

                                    <div className="mt-3 flex flex-col gap-3 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-[rgba(0,0,0,0.9)]">Rate resolution</p>
                                            <p className="text-[11px] text-[rgba(0,0,0,0.6)]">After ticket is closed</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className="grid h-8 w-8 place-items-center rounded-lg border border-[#e0dfdc] bg-white hover:border-[#0a66c2] hover:bg-[#eef3f8]"
                                                    aria-label={`Rate ${i} stars`}
                                                >
                                                    <LuStar className="h-3.5 w-3.5 text-[#915907]" aria-hidden />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </SectionCard>

            <MaintenanceRequestFormModal
                isOpen={formOpen}
                onClose={() => {
                    if (!isSubmitting) setFormOpen(false);
                }}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

            <MaintenanceTicketConfirmModal
                ticket={deleteTarget}
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    setTickets((list) => list.filter((item) => item.id !== deleteTarget.id));
                    setToast({ message: 'Maintenance request deleted.', variant: 'success' });
                }}
            />

            {toast ? (
                <InlineToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
            ) : null}
        </ResidentPageShell>
    );
}
