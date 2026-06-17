'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
    getLinkableServiceRequestsForResident,
    linkServiceRequestToResident,
    type ServiceMaintenanceTicket,
} from '@/lib/serviceMaintenanceStore';
import { cn } from '@/lib/utils';
import { LuSearch } from 'react-icons/lu';

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

export function ResidentLinkServiceRequestModal({
    isOpen,
    onClose,
    residentSlug,
    residentName,
    propertyUnit,
    onLinked,
}: {
    isOpen: boolean;
    onClose: () => void;
    residentSlug: string;
    residentName: string;
    propertyUnit: string;
    onLinked: (ticket: ServiceMaintenanceTicket) => void;
}) {
    const [search, setSearch] = useState('');
    const [selectedSlug, setSelectedSlug] = useState('');
    const [linking, setLinking] = useState(false);
    const [listVersion, setListVersion] = useState(0);

    useEffect(() => {
        if (!isOpen) return;
        setSearch('');
        setSelectedSlug('');
        setLinking(false);
        setListVersion((n) => n + 1);
    }, [isOpen, residentSlug]);

    const candidates = useMemo(
        () => getLinkableServiceRequestsForResident(residentSlug),
        [residentSlug, listVersion],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return candidates;
        return candidates.filter((t) => {
            const hay = `${t.ticketCode} ${t.requestTitle} ${t.issueCategory} ${t.locationUnit} ${t.ticketStatus}`.toLowerCase();
            return hay.includes(q);
        });
    }, [candidates, search]);

    const selected = filtered.find((t) => t.slug === selectedSlug) ?? candidates.find((t) => t.slug === selectedSlug);

    const onLink = () => {
        if (!selectedSlug) return;
        setLinking(true);
        try {
            const updated = linkServiceRequestToResident(selectedSlug, residentSlug, propertyUnit);
            if (!updated) return;
            onLinked(updated);
            onClose();
        } finally {
            setLinking(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Link service request"
            maxWidthClassName="max-w-6xl"
            placement="top"
            footer={
                <>
                    <Button variant="companyOutline" size="cta" onClick={onClose} disabled={linking}>
                        Cancel
                    </Button>
                    <Button variant="company" size="cta" onClick={onLink} disabled={!selectedSlug || linking}>
                        {linking ? 'Linking…' : 'Link to resident'}
                    </Button>
                </>
            }
        >
            <p className="mb-3 text-sm text-slate-600">
                Select an existing service request to link to{' '}
                <span className="font-semibold text-slate-900">{residentName}</span>
                {propertyUnit ? (
                    <>
                        {' '}
                        at <span className="font-semibold text-slate-900">{propertyUnit}</span>
                    </>
                ) : null}
                .
            </p>
            <div className="relative mb-3">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ticket ID, title, category, unit…"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-(--cta-button-bg) focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                />
            </div>
            {filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-600">
                    {candidates.length === 0
                        ? 'No unlinked service requests available.'
                        : 'No service requests match your search.'}
                </p>
            ) : (
                <div className="max-h-[min(58vh,520px)] overflow-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full min-w-[920px] table-fixed text-left text-sm">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 backdrop-blur">
                            <tr>
                                <th className="w-12 px-3 py-2.5" aria-label="Select" />
                                <th className="w-[280px] px-3 py-2.5">Ticket</th>
                                <th className="w-[200px] px-3 py-2.5">Unit</th>
                                <th className="w-[120px] px-3 py-2.5">Category</th>
                                <th className="w-[120px] px-3 py-2.5">Priority</th>
                                <th className="w-[140px] px-3 py-2.5">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((t, idx) => {
                                const checked = selectedSlug === t.slug;
                                return (
                                    <tr
                                        key={t.slug}
                                        className={cn(
                                            'cursor-pointer border-t border-slate-100 transition-colors',
                                            idx % 2 === 1 && !checked ? 'bg-slate-50/30' : '',
                                            checked
                                                ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]'
                                                : 'hover:bg-slate-50/80',
                                        )}
                                        onClick={() => setSelectedSlug(t.slug)}
                                    >
                                        <td className="px-3 py-2.5 text-center align-top">
                                            <input
                                                type="radio"
                                                name="link-service-request"
                                                checked={checked}
                                                onChange={() => setSelectedSlug(t.slug)}
                                                className="h-4 w-4 accent-(--cta-button-bg)"
                                                aria-label={`Select ${t.ticketCode}`}
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 align-top">
                                            <p className="font-mono text-xs font-semibold text-slate-900">{t.ticketCode}</p>
                                            <p className="mt-0.5 truncate text-slate-700" title={t.requestTitle}>
                                                {t.requestTitle}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700">
                                            <span className="block truncate" title={t.locationUnit}>
                                                {t.locationUnit || '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700">{t.issueCategory}</td>
                                        <td className="px-3 py-2.5 text-slate-700">{t.priorityLevel}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={statusBadge(t.ticketStatus)}>{t.ticketStatus}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {selected ? (
                <p className="mt-3 text-xs text-slate-500">
                    Selected: <span className="font-semibold text-slate-700">{selected.ticketCode}</span> — {selected.requestTitle}
                </p>
            ) : null}
        </Modal>
    );
}
