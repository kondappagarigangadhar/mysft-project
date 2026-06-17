'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { WorkOrder } from '@/lib/workOrderStore';
import { cn } from '@/lib/utils';

function statusBadge(status: string) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold';
    if (s === 'completed' || s === 'verified') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'cancelled') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    if (s === 'on hold') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    if (s === 'in progress') return cn(base, 'border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-slate-800');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

function slaBadge(sla: string) {
    const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold';
    if (sla === 'Delayed') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    if (sla === 'At Risk') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
}

export function VendorProfileWorkOrdersTable({
    workOrders,
    projectName,
    vendorId,
}: {
    workOrders: WorkOrder[];
    projectName: string;
    vendorId: string;
}) {
    const rows = useMemo(() => workOrders.slice(0, 6), [workOrders]);
    const router = useRouter();

    const openWorkOrder = (slug: string) => {
        router.push(`/work-orders/view/${encodeURIComponent(slug)}`);
    };

    if (!rows.length) {
        return (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No work orders for {projectName || 'this project'} yet.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-2 py-2">Work Order ID</th>
                        <th className="px-2 py-2">Title</th>
                        <th className="px-2 py-2">Project</th>
                        <th className="px-2 py-2">Priority</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">SLA</th>
                        <th className="px-2 py-2">Due</th>
                        <th className="px-2 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((wo) => (
                        <tr
                            key={wo.slug}
                            className={cn('border-t border-slate-100 transition-colors hover:bg-slate-50/70', 'cursor-pointer')}
                            role="link"
                            tabIndex={0}
                            onClick={() => openWorkOrder(wo.slug)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') openWorkOrder(wo.slug);
                            }}
                        >
                            <td className="px-2 py-2 font-mono text-xs font-semibold text-slate-900">{wo.workOrderId}</td>
                            <td className="max-w-48 truncate px-2 py-2 text-slate-700" title={wo.title}>
                                {wo.title}
                            </td>
                            <td className="px-2 py-2 text-slate-700">{wo.projectOrProperty}</td>
                            <td className="px-2 py-2 text-slate-700">{wo.priority || '—'}</td>
                            <td className="px-2 py-2">
                                <span className={statusBadge(wo.lifecycle?.status ?? 'Draft')}>{wo.lifecycle?.status ?? 'Draft'}</span>
                            </td>
                            <td className="px-2 py-2">
                                <span className={slaBadge(wo.scheduling?.slaStatus ?? 'On Track')}>{wo.scheduling?.slaStatus ?? 'On Track'}</span>
                            </td>
                            <td className="px-2 py-2 text-slate-700">{wo.scheduling?.endDate || '—'}</td>
                            <td className="px-2 py-2">
                                <Link
                                    href={`/work-orders/view/${encodeURIComponent(wo.slug)}`}
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
            {workOrders.length > 6 ? (
                <p className="mt-2 text-xs text-slate-500">
                    Showing 6 of {workOrders.length} work orders for {projectName}.
                </p>
            ) : null}
        </div>
    );
}
