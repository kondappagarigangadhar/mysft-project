'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
    computeBillingTotals,
    formatVendorInvoiceDisplayDate,
    lineItemDraftAmount,
    type ServiceExecutionSlice,
    type VendorInvoiceLineItemDraft,
} from '@/lib/vendor-invoices/vendorInvoiceWorkOrderBridge';
import { formatMoney } from '@/lib/vendorInvoiceStore';
import { cn } from '@/lib/utils';
import { SERVICE_DESCRIPTION_SUGGESTIONS } from '@/lib/vendor-invoices/vendorInvoiceServiceCatalog';
import { LuPlus, LuTrash2 } from 'react-icons/lu';

const UNIT_OPTIONS = ['Job', 'Nos', 'Hrs', 'Sq.ft', 'Ltr', 'Kg', 'Set'];

export function VendorInvoiceServiceExecutionBilling({
    execution,
    lineItems,
    onLineItemsChange,
    discount,
    gstPercent,
    onDiscountChange,
    onGstPercentChange,
    isEditing,
    currency,
    storedSubtotal,
    storedGst,
    storedTotal,
    onRequestEdit,
}: {
    execution: ServiceExecutionSlice;
    lineItems: VendorInvoiceLineItemDraft[];
    onLineItemsChange: (items: VendorInvoiceLineItemDraft[]) => void;
    discount: string;
    gstPercent: string;
    onDiscountChange: (v: string) => void;
    onGstPercentChange: (v: string) => void;
    isEditing: boolean;
    currency: string;
    storedSubtotal?: number;
    storedGst?: number;
    storedTotal?: number;
    /** Enter edit mode before adding (e.g. when button clicked on view page). */
    onRequestEdit?: () => void;
}) {
    const discountNum = Number(discount) || 0;
    const gstNum = Number(gstPercent) || 18;
    const computed = computeBillingTotals(lineItems, discountNum, gstNum);
    const subtotal = isEditing ? computed.subtotal : (storedSubtotal ?? computed.subtotal);
    const gstAmount = isEditing ? computed.gstAmount : (storedGst ?? computed.gstAmount);
    const total = isEditing ? computed.invoiceAmount : (storedTotal ?? computed.invoiceAmount);

    const [highlightId, setHighlightId] = useState<string | null>(null);
    const descriptionRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const addService = useCallback(() => {
        if (!isEditing) {
            onRequestEdit?.();
        }
        const id = `li-new-${Date.now()}`;
        const suggestion =
            SERVICE_DESCRIPTION_SUGGESTIONS[lineItems.length % SERVICE_DESCRIPTION_SUGGESTIONS.length] ?? 'Service charges';
        onLineItemsChange([
            ...lineItems,
            { id, description: suggestion, quantity: '1', unit: 'Job', unitRate: '' },
        ]);
        setHighlightId(id);
        window.setTimeout(() => {
            descriptionRefs.current.get(id)?.focus();
            descriptionRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
        window.setTimeout(() => setHighlightId((prev) => (prev === id ? null : prev)), 1400);
    }, [isEditing, lineItems, onLineItemsChange, onRequestEdit]);

    const updateRow = (id: string, patch: Partial<VendorInvoiceLineItemDraft>) => {
        onLineItemsChange(lineItems.map((li) => (li.id === id ? { ...li, ...patch } : li)));
    };

    const removeRow = (id: string) => {
        if (lineItems.length <= 1) return;
        onLineItemsChange(lineItems.filter((li) => li.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2">
                <ExecutionField label="Service Performed" value={execution.servicePerformed} />
                <ExecutionField label="Work Completion Date" value={formatVendorInvoiceDisplayDate(execution.completionDate)} />
                <ExecutionField label="Project" value={execution.project} />
                <ExecutionField label="Tower" value={execution.tower} />
                <ExecutionField label="Unit" value={execution.unit} />
                <ExecutionField label="Resident Name" value={execution.residentName} />
                <ExecutionField label="Service Category" value={execution.serviceCategory} />
                <ExecutionField label="Vendor Name" value={execution.vendorName} />
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200/80">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 bg-slate-50/80 px-3 py-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Service Line Items</p>
                    <button
                        type="button"
                        onClick={addService}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--cta-button-bg)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_42%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]"
                    >
                        <LuPlus size={14} aria-hidden />
                        Add Service
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-3 py-2">Service Description</th>
                                <th className="w-20 px-3 py-2">Qty</th>
                                <th className="w-24 px-3 py-2">Unit</th>
                                <th className="w-28 px-3 py-2">Unit Rate</th>
                                <th className="w-28 px-3 py-2 text-right">Amount</th>
                                {isEditing ? <th className="w-10 px-2 py-2" aria-label="Actions" /> : null}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!lineItems.length ? (
                                <tr>
                                    <td
                                        colSpan={isEditing ? 6 : 5}
                                        className="px-3 py-6 text-center text-xs font-medium text-gray-500"
                                    >
                                        No services added yet. Click Add Service to bill labour, materials, or repairs.
                                    </td>
                                </tr>
                            ) : (
                                lineItems.map((li) => {
                                    const amt = lineItemDraftAmount(li);
                                    return (
                                        <tr
                                            key={li.id}
                                            className={cn(
                                                'odd:bg-gray-50/40 transition-colors',
                                                highlightId === li.id &&
                                                    'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] ring-2 ring-inset ring-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)]',
                                            )}
                                        >
                                            <td className="px-3 py-2">
                                                {isEditing ? (
                                                    <input
                                                        ref={(el) => {
                                                            if (el) descriptionRefs.current.set(li.id, el);
                                                            else descriptionRefs.current.delete(li.id);
                                                        }}
                                                        value={li.description}
                                                        onChange={(e) => updateRow(li.id, { description: e.target.value })}
                                                        placeholder="e.g. Pipe Replacement, Labour Charges"
                                                        list="vendor-invoice-service-suggestions"
                                                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-1 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                                    />
                                                ) : (
                                                    <span className="font-medium text-gray-900">{li.description || '—'}</span>
                                                )}
                                            </td>
                                        <td className="px-3 py-2">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={li.quantity}
                                                    onChange={(e) => updateRow(li.id, { quantity: e.target.value })}
                                                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm tabular-nums"
                                                />
                                            ) : (
                                                <span className="tabular-nums">{li.quantity}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {isEditing ? (
                                                <select
                                                    value={li.unit}
                                                    onChange={(e) => updateRow(li.id, { unit: e.target.value })}
                                                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                                                >
                                                    {UNIT_OPTIONS.map((u) => (
                                                        <option key={u} value={u}>
                                                            {u}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span>{li.unit || '—'}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={li.unitRate}
                                                    onChange={(e) => updateRow(li.id, { unitRate: e.target.value })}
                                                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm tabular-nums"
                                                />
                                            ) : (
                                                <span className="tabular-nums">{formatMoney(Number(li.unitRate) || 0, currency)}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-900">
                                            {formatMoney(amt, currency)}
                                        </td>
                                        {isEditing ? (
                                            <td className="px-2 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(li.id)}
                                                    disabled={lineItems.length <= 1}
                                                    className="rounded p-1 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                                                    aria-label="Remove service"
                                                >
                                                    <LuTrash2 size={14} />
                                                </button>
                                            </td>
                                        ) : null}
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <datalist id="vendor-invoice-service-suggestions">
                    {SERVICE_DESCRIPTION_SUGGESTIONS.map((s) => (
                        <option key={s} value={s} />
                    ))}
                </datalist>
            </div>

            <div className="rounded-lg border border-gray-200/80 bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Billing Summary</p>
                <dl className="mt-3 max-w-sm space-y-1.5 text-sm sm:ml-auto">
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Subtotal</dt>
                        <dd className="font-medium tabular-nums">{formatMoney(subtotal, currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-500">Discount</dt>
                        <dd className="tabular-nums">
                            {isEditing ? (
                                <input
                                    type="number"
                                    min={0}
                                    value={discount}
                                    onChange={(e) => onDiscountChange(e.target.value)}
                                    className="w-28 rounded border border-gray-200 px-2 py-1 text-right text-sm tabular-nums"
                                />
                            ) : (
                                formatMoney(discountNum, currency)
                            )}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-500">GST %</dt>
                        <dd className="tabular-nums">
                            {isEditing ? (
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={gstPercent}
                                    onChange={(e) => onGstPercentChange(e.target.value)}
                                    className="w-20 rounded border border-gray-200 px-2 py-1 text-right text-sm tabular-nums"
                                />
                            ) : (
                                `${gstNum}%`
                            )}
                        </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">GST Amount</dt>
                        <dd className="tabular-nums">{formatMoney(gstAmount, currency)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-gray-200 pt-2">
                        <dt className="font-semibold text-gray-900">Final Invoice Total</dt>
                        <dd className="text-base font-bold tabular-nums text-gray-900">{formatMoney(total, currency)}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

function ExecutionField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50">
            <div className="w-44 shrink-0 text-sm font-medium text-gray-500">{label}</div>
            <div className="flex w-full items-center gap-2 text-[15px] font-medium text-gray-900">
                <span className="text-gray-300" aria-hidden>
                    :
                </span>
                <span className={cn('w-full', !value || value === '—' ? 'text-gray-400' : '')}>{value?.trim() || '—'}</span>
            </div>
        </div>
    );
}
