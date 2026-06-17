'use client';

import React, { useMemo } from 'react';
import type { WorkOrder } from '@/lib/workOrderStore';
import {
    getServiceRequestOptionsForVendorWorkOrders,
    isWorkOrderBillable,
} from '@/lib/vendor-invoices/vendorInvoiceWorkOrderBridge';
import { LuClipboardList } from 'react-icons/lu';

export function VendorInvoiceWorkOrderPicker({
    workOrders,
    invoicedWorkOrderIds,
    selectedWorkOrderId,
    selectedServiceRequestId,
    onSelectWorkOrder,
    onSelectServiceRequest,
    vendorLocked,
    vendorName,
}: {
    workOrders: WorkOrder[];
    invoicedWorkOrderIds: Set<string>;
    selectedWorkOrderId: string;
    selectedServiceRequestId?: string;
    onSelectWorkOrder: (workOrderId: string) => void;
    onSelectServiceRequest?: (serviceRequestId: string, workOrderId: string) => void;
    vendorLocked?: boolean;
    vendorName?: string;
}) {
    const billable = useMemo(() => workOrders.filter((w) => isWorkOrderBillable(w)), [workOrders]);
    const serviceRequests = useMemo(() => getServiceRequestOptionsForVendorWorkOrders(billable), [billable]);

    return (
        <div className="mt-3 rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_24%,transparent)] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]">
                    <LuClipboardList size={18} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Bill completed work</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                        {vendorLocked && vendorName
                            ? `Creating invoice for ${vendorName}. Select a work order or service request to auto-fill project, unit, resident, and billing details.`
                            : 'Vendor invoices must be created from a completed work order or service request. Select a job below to auto-fill vendor, project, and billing details.'}
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Completed work order
                            <select
                                value={selectedWorkOrderId}
                                onChange={(e) => onSelectWorkOrder(e.target.value)}
                                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                            >
                                <option value="">Select completed work order…</option>
                                {billable.map((wo) => {
                                    const invoiced = invoicedWorkOrderIds.has(wo.workOrderId);
                                    return (
                                        <option key={wo.workOrderId} value={wo.workOrderId} disabled={invoiced}>
                                            {wo.workOrderId} — {wo.title}
                                            {invoiced ? ' (invoice exists)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>

                        {serviceRequests.length > 0 ? (
                            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Or service request
                                <select
                                    value={selectedServiceRequestId ?? ''}
                                    onChange={(e) => {
                                        const sr = e.target.value;
                                        if (!sr) {
                                            onSelectServiceRequest?.('', '');
                                            return;
                                        }
                                        const match = serviceRequests.find((o) => o.serviceRequestId === sr);
                                        if (match) onSelectServiceRequest?.(match.serviceRequestId, match.workOrderId);
                                    }}
                                    className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                >
                                    <option value="">Select service request…</option>
                                    {serviceRequests.map((sr) => {
                                        const invoiced = invoicedWorkOrderIds.has(sr.workOrderId);
                                        return (
                                            <option key={sr.serviceRequestId} value={sr.serviceRequestId} disabled={invoiced}>
                                                {sr.label}
                                                {invoiced ? ' (invoice exists)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </label>
                        ) : null}
                    </div>

                    {!billable.length ? (
                        <p className="mt-2 text-xs font-medium text-amber-800">
                            No completed work orders with vendor assignment are available to bill
                            {vendorLocked && vendorName ? ` for ${vendorName}` : ''}.
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
