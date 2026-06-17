'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { assignWorkOrderToVendor, getAssignableWorkOrdersForVendor } from '@/lib/vendors/vendorWorkOrders';
import type { WorkOrder } from '@/lib/workOrderStore';
import { cn } from '@/lib/utils';
import { LuSearch } from 'react-icons/lu';

function statusBadge(status: string) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold';
    if (s === 'completed' || s === 'verified') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'cancelled') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    if (s === 'on hold') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    if (s === 'in progress') return cn(base, 'border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-slate-800');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

export function VendorAssignWorkOrderModal({
    isOpen,
    onClose,
    vendorId,
    vendorName,
    primaryProject,
    onAssigned,
}: {
    isOpen: boolean;
    onClose: () => void;
    vendorId: string;
    vendorName: string;
    primaryProject: string;
    onAssigned: (workOrder: WorkOrder) => void;
}) {
    const [search, setSearch] = useState('');
    const [selectedSlug, setSelectedSlug] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [listVersion, setListVersion] = useState(0);

    useEffect(() => {
        if (!isOpen) return;
        setSearch('');
        setSelectedSlug('');
        setAssigning(false);
        setListVersion((n) => n + 1);
    }, [isOpen, vendorId]);

    const candidates = useMemo(
        () => getAssignableWorkOrdersForVendor(vendorId, vendorName),
        [vendorId, vendorName, listVersion],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return candidates;
        return candidates.filter((wo) => {
            const hay = `${wo.workOrderId} ${wo.title} ${wo.projectOrProperty} ${wo.vendor?.vendorName ?? ''} ${wo.lifecycle?.status ?? ''}`.toLowerCase();
            return hay.includes(q);
        });
    }, [candidates, search]);

    const selected = filtered.find((wo) => wo.slug === selectedSlug) ?? candidates.find((wo) => wo.slug === selectedSlug);

    const onAssign = () => {
        if (!selectedSlug) return;
        setAssigning(true);
        try {
            const updated = assignWorkOrderToVendor(selectedSlug, { id: vendorId, name: vendorName });
            if (!updated) return;
            onAssigned(updated);
            onClose();
        } finally {
            setAssigning(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Assign work order"
            maxWidthClassName="max-w-6xl"
            placement="top"
            footer={
                <>
                    <Button variant="companyOutline" size="cta" onClick={onClose} disabled={assigning}>
                        Cancel
                    </Button>
                    <Button variant="company" size="cta" onClick={onAssign} disabled={!selectedSlug || assigning}>
                        {assigning ? 'Assigning…' : 'Assign to vendor'}
                    </Button>
                </>
            }
        >
            <p className="mb-3 text-sm text-slate-600">
                Select a work order on <span className="font-semibold text-slate-900">{primaryProject || 'this project'}</span> to assign to{' '}
                <span className="font-semibold text-slate-900">{vendorName}</span>.
            </p>
            <div className="relative mb-3">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search work order ID, title, current vendor…"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-(--cta-button-bg) focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                />
            </div>
            {filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-600">
                    {candidates.length === 0
                        ? 'No unassigned work orders on this project.'
                        : 'No work orders match your search.'}
                </p>
            ) : (
                <div className="max-h-[min(58vh,520px)] overflow-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full min-w-[980px] table-fixed text-left text-sm">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 backdrop-blur">
                            <tr>
                                <th className="w-12 px-3 py-2.5" aria-label="Select" />
                                <th className="w-[320px] px-3 py-2.5">Work Order</th>
                                <th className="w-[220px] px-3 py-2.5">Project</th>
                                <th className="w-[220px] px-3 py-2.5">Current vendor</th>
                                <th className="w-[120px] px-3 py-2.5">Priority</th>
                                <th className="w-[160px] px-3 py-2.5">Status</th>
                                <th className="w-[120px] px-3 py-2.5">SLA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((wo, idx) => {
                                const checked = selectedSlug === wo.slug;
                                return (
                                    <tr
                                        key={wo.slug}
                                        className={cn(
                                            'cursor-pointer border-t border-slate-100 transition-colors',
                                            idx % 2 === 1 && !checked ? 'bg-slate-50/30' : '',
                                            checked
                                                ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]'
                                                : 'hover:bg-slate-50/80',
                                        )}
                                        onClick={() => setSelectedSlug(wo.slug)}
                                    >
                                        <td className="px-3 py-2.5 text-center align-top">
                                            <input
                                                type="radio"
                                                name="assign-work-order"
                                                checked={checked}
                                                onChange={() => setSelectedSlug(wo.slug)}
                                                className="h-4 w-4 accent-(--cta-button-bg)"
                                                aria-label={`Select ${wo.workOrderId}`}
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 align-top">
                                            <p className="font-mono text-xs font-semibold text-slate-900">{wo.workOrderId}</p>
                                            <p className="mt-0.5 truncate text-slate-700" title={wo.title}>
                                                {wo.title}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700">
                                            <span className="block truncate" title={wo.projectOrProperty || ''}>
                                                {wo.projectOrProperty || '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700">
                                            <span className="block truncate" title={wo.vendor?.vendorName?.trim() || ''}>
                                                {wo.vendor?.vendorName?.trim() || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700">{wo.priority || '—'}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={statusBadge(wo.lifecycle?.status ?? 'Draft')}>{wo.lifecycle?.status ?? 'Draft'}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700">{wo.scheduling?.slaStatus ?? '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {selected ? (
                <p className="mt-3 text-xs text-slate-500">
                    Selected: <span className="font-semibold text-slate-700">{selected.workOrderId}</span> — {selected.title}
                </p>
            ) : null}
        </Modal>
    );
}
