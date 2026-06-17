'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import { getLinkableInvoicesForPr, linkInvoiceToPr, type Invoice } from '@/lib/invoiceStore';
import { formatPrLinkedInvoiceDate } from '@/lib/procurement/prLinkedInvoices';
import { resolvePrProcurementLinkContext } from '@/lib/procurement/prProcurementLinks';
import { cn } from '@/lib/utils';
import { LuSearch } from 'react-icons/lu';

function validationTone(status: string) {
    if (status === 'Approved') return 'success' as const;
    if (status === 'Rejected') return 'danger' as const;
    return 'warning' as const;
}

function paymentTone(status: string) {
    if (status === 'Paid') return 'success' as const;
    if (status === 'Partial') return 'warning' as const;
    if (status === 'Pending') return 'warning' as const;
    return 'neutral' as const;
}

export function PrLinkInvoiceModal({
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
    onLinked: (invoice: Invoice) => void;
}) {
    const [search, setSearch] = useState('');
    const [validationFilter, setValidationFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const [selectedSlug, setSelectedSlug] = useState('');
    const [linking, setLinking] = useState(false);
    const [listVersion, setListVersion] = useState(0);

    useEffect(() => {
        if (!isOpen) return;
        setSearch('');
        setValidationFilter('');
        setPaymentFilter('');
        setSelectedSlug('');
        setLinking(false);
        setListVersion((n) => n + 1);
    }, [isOpen, prSlug]);

    const candidates = useMemo(() => getLinkableInvoicesForPr(prSlug), [prSlug, listVersion]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return candidates.filter((inv) => {
            if (validationFilter && (inv.validation?.status ?? 'Pending') !== validationFilter) return false;
            if (paymentFilter && inv.paymentStatus !== paymentFilter) return false;
            if (!q) return true;
            const hay = `${inv.invoiceId} ${inv.invoiceNumber} ${inv.partyName} ${inv.linkedProject} ${inv.linkedPurchaseOrder} ${inv.paymentStatus}`.toLowerCase();
            return hay.includes(q);
        });
    }, [candidates, search, validationFilter, paymentFilter]);

    const onLink = () => {
        if (!selectedSlug) return;
        setLinking(true);
        try {
            const ctx = resolvePrProcurementLinkContext(prSlug);
            const linked = linkInvoiceToPr(selectedSlug, prSlug, prNumber, {
                linkedProject: ctx?.project,
                linkedPurchaseOrder: ctx?.linkedPurchaseOrderLabel,
            });
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
            title="Link invoice"
            maxWidthClassName="max-w-5xl"
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
                Attach an existing invoice from{' '}
                <span className="font-semibold text-slate-900">Invoice &amp; Payments</span> to{' '}
                <span className="font-semibold text-slate-900">{prNumber}</span>.
            </p>
            <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <div className="relative">
                    <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search invoice ID, number, vendor…"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                    />
                </div>
                <select
                    value={validationFilter}
                    onChange={(e) => setValidationFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                    aria-label="Filter by validation"
                >
                    <option value="">All validation</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                    aria-label="Filter by payment"
                >
                    <option value="">All payment</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                </select>
            </div>
            {filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-600">
                    {candidates.length === 0
                        ? 'No other invoices available to link.'
                        : 'No invoices match your search or filters.'}
                </p>
            ) : (
                <div className="max-h-[min(52vh,420px)] overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[920px] text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="w-10 px-2 py-2" aria-label="Select" />
                                <th className="px-2 py-2">Invoice ID</th>
                                <th className="px-2 py-2">Invoice number</th>
                                <th className="px-2 py-2">Project</th>
                                <th className="px-2 py-2">Linked PO</th>
                                <th className="px-2 py-2">Vendor / supplier</th>
                                <th className="px-2 py-2">Due date</th>
                                <th className="px-2 py-2">Validation</th>
                                <th className="px-2 py-2">Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((inv) => {
                                const checked = selectedSlug === inv.slug;
                                return (
                                    <tr
                                        key={inv.slug}
                                        className={cn(
                                            'cursor-pointer border-t border-slate-100 transition-colors',
                                            checked ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]' : 'hover:bg-slate-50/80',
                                        )}
                                        onClick={() => setSelectedSlug(inv.slug)}
                                    >
                                        <td className="px-2 py-2">
                                            <input
                                                type="radio"
                                                name="link-invoice"
                                                checked={checked}
                                                onChange={() => setSelectedSlug(inv.slug)}
                                                aria-label={`Select ${inv.invoiceId}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 font-mono text-xs font-semibold text-slate-900">{inv.invoiceId}</td>
                                        <td className="px-2 py-2 text-slate-800">{inv.invoiceNumber?.trim() || '—'}</td>
                                        <td className="max-w-28 truncate px-2 py-2 text-slate-700" title={inv.linkedProject}>
                                            {inv.linkedProject?.trim() || '—'}
                                        </td>
                                        <td className="px-2 py-2 font-mono text-xs text-slate-700">{inv.linkedPurchaseOrder?.trim() || '—'}</td>
                                        <td className="max-w-32 truncate px-2 py-2 text-slate-700" title={inv.partyName}>
                                            {inv.partyName?.trim() || '—'}
                                        </td>
                                        <td className="px-2 py-2 text-slate-700">{formatPrLinkedInvoiceDate(inv.dueDate)}</td>
                                        <td className="px-2 py-2">
                                            <BpStatusBadge tone={validationTone(inv.validation?.status ?? 'Pending')}>
                                                {inv.validation?.status ?? 'Pending'}
                                            </BpStatusBadge>
                                        </td>
                                        <td className="px-2 py-2">
                                            <BpStatusBadge tone={paymentTone(inv.paymentStatus)}>{inv.paymentStatus}</BpStatusBadge>
                                        </td>
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
