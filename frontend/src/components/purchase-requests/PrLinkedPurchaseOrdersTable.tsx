'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import type { PurchaseOrder } from '@/lib/purchaseOrderStore';
import { unlinkPurchaseOrderFromPr } from '@/lib/purchaseOrderStore';
import { deliveryStatusLabel, formatPrLinkedPoCreatedDate } from '@/lib/procurement/prLinkedPurchaseOrders';
import { poDeliveryProgressPct, poDisplayStatus, poProcurementCompletionPct } from '@/lib/procurement/prProcurementWorkflow';
import { cn } from '@/lib/utils';
import { LuReceipt, LuTrash2 } from 'react-icons/lu';

function statusPill(label: string, tone: 'slate' | 'amber' | 'emerald' | 'rose' | 'blue') {
    const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide';
    if (tone === 'emerald') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (tone === 'amber') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    if (tone === 'rose') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    if (tone === 'blue') return cn(base, 'border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-slate-800');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

function poStatusTone(s: ReturnType<typeof poDisplayStatus>): 'slate' | 'amber' | 'emerald' | 'blue' {
    if (s === 'Delivered') return 'emerald';
    if (s === 'Sent') return 'blue';
    return 'slate';
}

function ProgressBar({ pct }: { pct: number }) {
    const bar = pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-300';
    return (
        <div className="min-w-[72px]">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
            </div>
            <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-slate-600">{pct}%</p>
        </div>
    );
}

export function PrLinkedPurchaseOrdersTable({
    orders,
    prSlug,
    projectName = '',
    maxRows = 12,
    canCreateInvoice = false,
    canManage = true,
    onCreateInvoiceForPo,
}: {
    orders: PurchaseOrder[];
    prSlug: string;
    projectName?: string;
    maxRows?: number;
    /** When true, per-row Create invoice is enabled (approved PR with POs). */
    canCreateInvoice?: boolean;
    canManage?: boolean;
    onCreateInvoiceForPo?: (po: PurchaseOrder) => void;
}) {
    const rows = useMemo(() => orders.slice(0, maxRows), [orders, maxRows]);
    const router = useRouter();

    const openPo = useCallback((slug: string) => {
        router.push(`/procurement/purchase-orders/view/${encodeURIComponent(slug)}?tab=overview`);
    }, [router]);

    const onUnlink = useCallback(
        (po: PurchaseOrder) => {
            if (
                !window.confirm(
                    `Unlink ${po.poNumber} from this purchase request only? The purchase order is not deleted and stays in Purchase Orders.`,
                )
            ) {
                return;
            }
            unlinkPurchaseOrderFromPr(po.slug, prSlug);
        },
        [prSlug],
    );

    if (!rows.length) {
        return (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No purchase orders linked to this request yet. Use Link or Create to start procurement.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-2 py-2">PO Number</th>
                        <th className="px-2 py-2">Project</th>
                        <th className="px-2 py-2">PO Status</th>
                        <th className="px-2 py-2">Supplier</th>
                        <th className="px-2 py-2">Material</th>
                        <th className="px-2 py-2">Qty</th>
                        <th className="px-2 py-2">Total</th>
                        <th className="px-2 py-2">Delivery</th>
                        <th className="px-2 py-2">Delivery progress</th>
                        <th className="px-2 py-2">Complete</th>
                        <th className="px-2 py-2">Created</th>
                        <th className="w-12 px-2 py-2 text-center"> </th>
                        <th className="min-w-[9.5rem] px-2 py-2 text-right">Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((po) => {
                        const del = deliveryStatusLabel(po);
                        const poSt = poDisplayStatus(po);
                        const delPct = poDeliveryProgressPct(po);
                        const completePct = poProcurementCompletionPct(po);
                        return (
                            <tr
                                key={po.slug}
                                className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                                role="link"
                                tabIndex={0}
                                onClick={() => openPo(po.slug)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') openPo(po.slug);
                                }}
                            >
                                <td className="px-2 py-2 font-mono text-xs font-semibold text-slate-900">{po.poNumber}</td>
                                <td className="max-w-32 truncate px-2 py-2 text-slate-700" title={projectName}>
                                    {projectName?.trim() || '—'}
                                </td>
                                <td className="px-2 py-2">
                                    <span className={statusPill(poSt, poStatusTone(poSt))}>{poSt}</span>
                                </td>
                                <td className="max-w-32 truncate px-2 py-2 text-slate-700" title={po.supplierName}>
                                    {po.supplierName}
                                </td>
                                <td className="max-w-36 truncate px-2 py-2 text-slate-700" title={po.material}>
                                    {po.material}
                                </td>
                                <td className="px-2 py-2 tabular-nums text-slate-700">{po.quantity.toLocaleString('en-IN')}</td>
                                <td className="px-2 py-2 tabular-nums text-slate-800">
                                    {po.currency} {po.totalAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="px-2 py-2">
                                    <span className={statusPill(del, del === 'Completed' ? 'emerald' : del === 'Partial' ? 'amber' : 'slate')}>
                                        {del}
                                    </span>
                                </td>
                                <td className="px-2 py-2">
                                    <ProgressBar pct={delPct} />
                                </td>
                                <td className="px-2 py-2">
                                    <span className="text-xs font-bold tabular-nums text-slate-800">{completePct}%</span>
                                </td>
                                <td className="px-2 py-2 text-slate-700">{formatPrLinkedPoCreatedDate(po.createdAt)}</td>
                                <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        disabled={!canManage}
                                        title="Unlink from purchase request"
                                        aria-label={`Unlink ${po.poNumber} from purchase request`}
                                        className="inline-flex rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                        onClick={() => onUnlink(po)}
                                    >
                                        <LuTrash2 className='text-red-600 hover:text-[var(--cta-button-bg)]' size={16} aria-hidden />
                                    </button>
                                </td>
                                <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="company"
                                        className="gap-1 whitespace-nowrap shadow-sm"
                                        disabled={!canCreateInvoice || !onCreateInvoiceForPo}
                                        title={
                                            canCreateInvoice
                                                ? `Create invoice for ${po.poNumber}`
                                                : 'Approve request and link POs to create invoices'
                                        }
                                        onClick={() => onCreateInvoiceForPo?.(po)}
                                    >
                                        <LuReceipt size={14} aria-hidden />
                                        Create invoice
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {orders.length > maxRows ? (
                <p className="mt-2 text-xs text-slate-500">
                    Showing {maxRows} of {orders.length} linked purchase orders.
                </p>
            ) : null}
        </div>
    );
}
