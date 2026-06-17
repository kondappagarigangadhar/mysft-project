'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import { formatMoney, type VendorInvoice } from '@/lib/vendorInvoiceStore';
import { downloadVendorInvoicePdf } from '@/lib/vendors/vendorInvoiceProfileHelpers';
import { cn } from '@/lib/utils';
import { LuDownload } from 'react-icons/lu';

function approvalTone(status: string) {
    if (status === 'Approved' || status === 'Paid') return 'success' as const;
    if (status === 'Rejected') return 'danger' as const;
    if (status === 'Under Review' || status === 'Submitted') return 'warning' as const;
    return 'neutral' as const;
}

function paymentTone(status: string) {
    if (status === 'Paid') return 'success' as const;
    if (status === 'Partial') return 'warning' as const;
    return 'neutral' as const;
}

export function VendorProfileInvoicesTable({ invoices }: { invoices: VendorInvoice[] }) {
    const router = useRouter();

    const openInvoice = (slug: string) => {
        router.push(`/company-admin/vendors/invoices/view/${encodeURIComponent(slug)}?tab=overview`);
    };

    if (!invoices.length) {
        return (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No vendor invoices submitted yet. Create an invoice from a completed work order.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-2 py-2">Invoice Number</th>
                        <th className="px-2 py-2">Invoice Date</th>
                        <th className="px-2 py-2">Project</th>
                        <th className="px-2 py-2">Work Order</th>
                        <th className="px-2 py-2">Service Category</th>
                        <th className="px-2 py-2">Invoice Amount</th>
                        <th className="px-2 py-2">Paid Amount</th>
                        <th className="px-2 py-2">Balance Amount</th>
                        <th className="px-2 py-2">Approval Status</th>
                        <th className="px-2 py-2">Payment Status</th>
                        <th className="px-2 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((inv) => (
                        <tr
                            key={inv.slug}
                            className={cn('border-t border-slate-100 transition-colors hover:bg-slate-50/70', 'cursor-pointer')}
                            role="link"
                            tabIndex={0}
                            onClick={() => openInvoice(inv.slug)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') openInvoice(inv.slug);
                            }}
                        >
                            <td className="px-2 py-2">
                                <Link
                                    href={`/company-admin/vendors/invoices/view/${encodeURIComponent(inv.slug)}?tab=overview`}
                                    className="font-mono text-xs font-semibold text-(--cta-button-bg) hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {inv.invoiceNumber}
                                </Link>
                            </td>
                            <td className="px-2 py-2 text-slate-700">{inv.invoiceDate}</td>
                            <td className="px-2 py-2 text-slate-700">{inv.linkedProject || '—'}</td>
                            <td className="px-2 py-2 font-mono text-xs text-slate-700">{inv.linkedWorkOrderId || '—'}</td>
                            <td className="px-2 py-2 text-slate-700">{inv.vendorCategory || inv.workOrderRef?.issueCategory || '—'}</td>
                            <td className="px-2 py-2 font-medium text-slate-900">{formatMoney(inv.invoiceAmount, inv.currency)}</td>
                            <td className="px-2 py-2 text-slate-700">{formatMoney(inv.paidAmount, inv.currency)}</td>
                            <td className="px-2 py-2 text-slate-700">{formatMoney(inv.balanceAmount, inv.currency)}</td>
                            <td className="px-2 py-2">
                                <BpStatusBadge tone={approvalTone(inv.approvalStatus)}>{inv.approvalStatus}</BpStatusBadge>
                            </td>
                            <td className="px-2 py-2">
                                <BpStatusBadge tone={paymentTone(inv.paymentStatus)}>{inv.paymentStatus}</BpStatusBadge>
                            </td>
                            <td className="px-2 py-2">
                                <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Link
                                        href={`/company-admin/vendors/invoices/view/${encodeURIComponent(inv.slug)}?tab=overview`}
                                        className="text-xs font-semibold text-(--cta-button-bg) hover:underline"
                                    >
                                        Open
                                    </Link>
                                    <Link
                                        href={`/company-admin/vendors/invoices/view/${encodeURIComponent(inv.slug)}?tab=overview&edit=1`}
                                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                                        onClick={() => downloadVendorInvoicePdf(inv)}
                                    >
                                        <LuDownload size={12} aria-hidden />
                                        PDF
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
