'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
    getLinkablePurchaseOrdersForPr,
    linkPurchaseOrderToPr,
    type PurchaseOrder,
    type PurchaseOrderStatus,
} from '@/lib/purchaseOrderStore';
import {
    deliveryStatusLabel,
    poDeliveryFilterOptions,
    poStatusFilterOptions,
} from '@/lib/procurement/prLinkedPurchaseOrders';
import { cn } from '@/lib/utils';
import { LuSearch } from 'react-icons/lu';

export function PrLinkPurchaseOrderModal({
    isOpen,
    onClose,
    prSlug,
    prNumber,
    onLinked,
}: {
    isOpen: boolean;
    onClose: () => void;
    prSlug: string;
    prNumber: string;
    onLinked: (po: PurchaseOrder) => void;
}) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
    const [deliveryFilter, setDeliveryFilter] = useState<string>('');
    const [selectedSlug, setSelectedSlug] = useState('');
    const [linking, setLinking] = useState(false);
    const [listVersion, setListVersion] = useState(0);

    useEffect(() => {
        if (!isOpen) return;
        setSearch('');
        setStatusFilter('');
        setDeliveryFilter('');
        setSelectedSlug('');
        setLinking(false);
        setListVersion((n) => n + 1);
    }, [isOpen, prSlug]);

    const candidates = useMemo(() => getLinkablePurchaseOrdersForPr(prSlug), [prSlug, listVersion]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return candidates.filter((po) => {
            if (statusFilter && po.status !== statusFilter) return false;
            const del = deliveryStatusLabel(po);
            if (deliveryFilter && del !== deliveryFilter) return false;
            if (!q) return true;
            const hay = `${po.poNumber} ${po.supplierName} ${po.material} ${po.prNumber} ${po.status} ${del}`.toLowerCase();
            return hay.includes(q);
        });
    }, [candidates, search, statusFilter, deliveryFilter]);

    const onLink = () => {
        if (!selectedSlug) return;
        setLinking(true);
        try {
            const linked = linkPurchaseOrderToPr(selectedSlug, prSlug);
            if (linked) {
                onLinked(linked);
                onClose();
            }
        } finally {
            setLinking(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Link purchase order"
            maxWidthClassName="max-w-4xl"
            placement="top"
            footer={
                <>
                    <Button variant="companyOutline" size="cta" onClick={onClose} disabled={linking}>
                        Cancel
                    </Button>
                    <Button variant="company" size="cta" onClick={onLink} disabled={!selectedSlug || linking}>
                        {linking ? 'Linking…' : 'Link to request'}
                    </Button>
                </>
            }
        >
            <p className="mb-3 text-sm text-slate-600">
                Attach an existing purchase order to <span className="font-semibold text-slate-900">{prNumber}</span>. One request
                can have multiple POs (split quantities or suppliers).
            </p>
            <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <div className="relative">
                    <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search PO number or supplier…"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | '')}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                    aria-label="Filter by PO status"
                >
                    <option value="">All statuses</option>
                    {poStatusFilterOptions().map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <select
                    value={deliveryFilter}
                    onChange={(e) => setDeliveryFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                    aria-label="Filter by delivery status"
                >
                    <option value="">All delivery</option>
                    {poDeliveryFilterOptions().map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>
            {filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-600">
                    {candidates.length === 0
                        ? 'No other purchase orders available to link.'
                        : 'No purchase orders match your search or filters.'}
                </p>
            ) : (
                <div className="max-h-[min(52vh,420px)] overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="w-10 px-2 py-2" aria-label="Select" />
                                <th className="px-2 py-2">PO Number</th>
                                <th className="px-2 py-2">Current PR</th>
                                <th className="px-2 py-2">Supplier</th>
                                <th className="px-2 py-2">Material</th>
                                <th className="px-2 py-2">Qty</th>
                                <th className="px-2 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((po) => {
                                const checked = selectedSlug === po.slug;
                                return (
                                    <tr
                                        key={po.slug}
                                        className={cn(
                                            'cursor-pointer border-t border-slate-100 transition-colors',
                                            checked ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]' : 'hover:bg-slate-50/80',
                                        )}
                                        onClick={() => setSelectedSlug(po.slug)}
                                    >
                                        <td className="px-2 py-2">
                                            <input
                                                type="radio"
                                                name="link-po"
                                                checked={checked}
                                                onChange={() => setSelectedSlug(po.slug)}
                                                aria-label={`Select ${po.poNumber}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 font-mono text-xs font-semibold text-slate-900">{po.poNumber}</td>
                                        <td className="px-2 py-2 text-slate-600">{po.prNumber || '—'}</td>
                                        <td className="px-2 py-2 text-slate-700">{po.supplierName}</td>
                                        <td className="max-w-32 truncate px-2 py-2 text-slate-700" title={po.material}>
                                            {po.material}
                                        </td>
                                        <td className="px-2 py-2 tabular-nums text-slate-700">{po.quantity}</td>
                                        <td className="px-2 py-2 text-slate-700">{po.status}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}
