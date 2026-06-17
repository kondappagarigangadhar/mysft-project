'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { ServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import {
    getServiceTicketAssignedDateLabel,
    getServiceTicketAssignedVendorLabel,
    getServiceTicketClosedDateLabel,
} from '@/lib/service-maintenance/serviceTicketResidentDisplay';
import { serviceMaintenanceViewHref } from '@/lib/serviceMaintenanceRoutes';
import { cn } from '@/lib/utils';

function statusBadge(status: string) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold';
    if (s === 'open') return cn(base, 'border-blue-200 bg-blue-50 text-blue-900');
    if (s === 'in progress') return cn(base, 'border-indigo-200 bg-indigo-50 text-indigo-900');
    if (s === 'on hold') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    if (s === 'resolved') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'closed') return cn(base, 'border-slate-200 bg-slate-100 text-slate-800');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

export function ResidentServiceRequestsTable({
    tickets,
    residentName,
    onCreate,
    readOnly,
}: {
    tickets: ServiceMaintenanceTicket[];
    residentName: string;
    onCreate?: () => void;
    readOnly?: boolean;
}) {
    const rows = useMemo(
        () =>
            tickets.slice(0, 6).map((t) => ({
                ticket: t,
                vendor: getServiceTicketAssignedVendorLabel(t),
                assignedDate: getServiceTicketAssignedDateLabel(t),
                closedDate: getServiceTicketClosedDateLabel(t),
            })),
        [tickets],
    );
    const router = useRouter();

    const openTicket = (slug: string) => {
        router.push(serviceMaintenanceViewHref(slug));
    };

    if (!rows.length) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm text-slate-600">No service requests linked to {residentName} yet.</p>
                {!readOnly && onCreate ? (
                    <button
                        type="button"
                        onClick={onCreate}
                        className="mt-3 text-sm font-semibold text-(--cta-button-bg) hover:text-(--cta-button-hover-bg) hover:underline"
                    >
                        Create service request
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-2 py-2">Ticket ID</th>
                        <th className="px-2 py-2">Title</th>
                        <th className="px-2 py-2">Unit</th>
                        <th className="px-2 py-2">Category</th>
                        <th className="px-2 py-2">Assigned vendor</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Assigned date</th>
                        <th className="px-2 py-2">Closed date</th>
                        <th className="px-2 py-2">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ ticket: t, vendor, assignedDate, closedDate }) => (
                        <tr
                            key={t.slug}
                            className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                            role="link"
                            tabIndex={0}
                            onClick={() => openTicket(t.slug)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') openTicket(t.slug);
                            }}
                        >
                            <td className="px-2 py-2 font-mono text-xs font-semibold text-slate-900">{t.ticketCode}</td>
                            <td className="max-w-44 truncate px-2 py-2 text-slate-700" title={t.requestTitle}>
                                {t.requestTitle}
                            </td>
                            <td className="max-w-32 truncate px-2 py-2 text-slate-700" title={t.locationUnit}>
                                {t.locationUnit || '—'}
                            </td>
                            <td className="px-2 py-2 text-slate-700">{t.issueCategory}</td>
                            <td className="max-w-36 truncate px-2 py-2 text-slate-700" title={vendor}>
                                <span className={vendor === 'Not Assigned' ? 'text-slate-400' : 'font-medium text-slate-800'}>
                                    {vendor}
                                </span>
                            </td>
                            <td className="px-2 py-2">
                                <span className={statusBadge(t.ticketStatus)}>{t.ticketStatus}</span>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs tabular-nums text-slate-700">{assignedDate}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-xs tabular-nums text-slate-700">{closedDate}</td>
                            <td className="px-2 py-2">
                                <Link
                                    href={serviceMaintenanceViewHref(t.slug)}
                                    className="text-xs font-semibold text-(--cta-button-bg) hover:text-(--cta-button-hover-bg) hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Open
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {tickets.length > 6 ? (
                <p className="mt-2 text-xs text-slate-500">
                    Showing 6 of {tickets.length} service requests for {residentName}.
                </p>
            ) : null}
        </div>
    );
}
