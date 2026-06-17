'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import type { Invoice } from '@/lib/invoiceStore';
import { formatINR, unlinkInvoiceFromPurchaseRequest } from '@/lib/invoiceStore';
import { formatPrLinkedInvoiceDate } from '@/lib/procurement/prLinkedInvoices';
import { LuTrash2 } from 'react-icons/lu';

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

function formatMoney(amount: number, currency: string) {
    if (currency === 'INR') return formatINR(amount);
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
    } catch {
        return `${currency} ${amount.toLocaleString('en-IN')}`;
    }
}

export function PrLinkedInvoicesTable({
    invoices,
    prSlug,
    maxRows = 12,
    canManage = true,
}: {
    invoices: Invoice[];
    prSlug: string;
    maxRows?: number;
    canManage?: boolean;
}) {
    const rows = useMemo(() => invoices.slice(0, maxRows), [invoices, maxRows]);
    const router = useRouter();

    const openInvoice = useCallback(
        (slug: string) => {
            router.push(`/company-admin/invoices/view/${encodeURIComponent(slug)}?tab=overview`);
        },
        [router],
    );

    const onUnlink = useCallback(
        (inv: Invoice) => {
            const label = inv.invoiceNumber?.trim() || inv.invoiceId;
            if (
                !window.confirm(
                    `Unlink ${label} from this purchase request only? The invoice record is not deleted and stays in Invoice & Payments.`,
                )
            ) {
                return;
            }
            unlinkInvoiceFromPurchaseRequest(inv.slug, prSlug);
        },
        [prSlug],
    );

    if (!rows.length) {
        return (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No invoices linked yet. Link an invoice or create one from a purchase order row above.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-2 py-2">Invoice ID</th>
                        <th className="px-2 py-2">Invoice number</th>
                        <th className="px-2 py-2">Project</th>
                        <th className="px-2 py-2">Linked PR</th>
                        <th className="px-2 py-2">Vendor / supplier</th>
                        <th className="px-2 py-2">Linked PO</th>
                        <th className="px-2 py-2">Invoice date</th>
                        <th className="px-2 py-2">Due date</th>
                        <th className="px-2 py-2">Amount</th>
                        <th className="px-2 py-2">Paid</th>
                        <th className="px-2 py-2">Balance</th>
                        <th className="px-2 py-2">Validation</th>
                        <th className="px-2 py-2">Payment</th>
                        <th className="px-2 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((inv) => (
                        <tr
                            key={inv.slug}
                            className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                            role="link"
                            tabIndex={0}
                            onClick={() => openInvoice(inv.slug)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') openInvoice(inv.slug);
                            }}
                        >
                            <td className="px-2 py-2 font-mono text-xs font-semibold text-slate-900">{inv.invoiceId}</td>
                            <td className="px-2 py-2 text-slate-800">{inv.invoiceNumber?.trim() || '—'}</td>
                            <td className="max-w-32 truncate px-2 py-2 text-slate-700" title={inv.linkedProject}>
                                {inv.linkedProject?.trim() || '—'}
                            </td>
                            <td className="px-2 py-2 font-mono text-xs text-slate-700">{inv.linkedPrNumber?.trim() || '—'}</td>
                            <td className="max-w-36 truncate px-2 py-2 text-slate-700" title={inv.partyName}>
                                {inv.partyName?.trim() || '—'}
                            </td>
                            <td className="px-2 py-2 font-mono text-xs text-slate-700">{inv.linkedPurchaseOrder?.trim() || '—'}</td>
                            <td className="px-2 py-2 text-slate-700">{formatPrLinkedInvoiceDate(inv.invoiceDate)}</td>
                            <td className="px-2 py-2 text-slate-700">{formatPrLinkedInvoiceDate(inv.dueDate)}</td>
                            <td className="px-2 py-2 tabular-nums text-slate-800">{formatMoney(inv.totalAmount, inv.currency)}</td>
                            <td className="px-2 py-2 tabular-nums text-emerald-700">{formatMoney(inv.paidAmount, inv.currency)}</td>
                            <td className="px-2 py-2 tabular-nums font-semibold text-amber-700">{formatMoney(inv.balanceAmount, inv.currency)}</td>
                            <td className="px-2 py-2">
                                <BpStatusBadge tone={validationTone(inv.validation?.status ?? 'Pending')}>
                                    {inv.validation?.status ?? 'Pending'}
                                </BpStatusBadge>
                            </td>
                            <td className="px-2 py-2">
                                <BpStatusBadge tone={paymentTone(inv.paymentStatus)}>{inv.paymentStatus}</BpStatusBadge>
                            </td>
                            <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    disabled={!canManage}
                                    className="text-xs font-semibold text-red-600 hover:text-[var(--cta-button-bg)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => onUnlink(inv)}
                                >
                                   <LuTrash2 className='text-red-600 hover:text-[var(--cta-button-bg)]' size={16} aria-hidden />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {invoices.length > maxRows ? (
                <p className="mt-2 text-xs text-slate-500">
                    Showing {maxRows} of {invoices.length} linked invoices.
                </p>
            ) : null}
        </div>
    );
}
