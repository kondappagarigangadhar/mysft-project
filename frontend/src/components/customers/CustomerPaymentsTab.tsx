'use client';

import React from 'react';
import Link from 'next/link';
import { CustomerCollapsibleSection } from '@/components/customers/CustomerOverviewFieldKit';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn } from '@/components/data-table/types';
import type { Customer } from '@/lib/customersStore';
import { LuCreditCard, LuExternalLink } from 'react-icons/lu';

function fmtCurrency(n: number) {
    return `₹${n.toLocaleString('en-IN')}`;
}

type Props = {
    customer: Customer;
    trackingOpen: boolean;
    onTrackingOpenChange: (open: boolean) => void;
};

export function CustomerPaymentsTab({ customer, trackingOpen, onTrackingOpenChange }: Props) {
    const progress = customer.totalAmount > 0 ? Math.min(100, Math.round((customer.paidAmount / customer.totalAmount) * 100)) : 0;

    const historyColumns: DataTableColumn<(typeof customer.paymentHistory)[0]>[] = [
        { id: 'date', header: 'Date', render: (r) => r.date },
        { id: 'amount', header: 'Amount', render: (r) => fmtCurrency(r.amount) },
        { id: 'mode', header: 'Mode', render: (r) => r.mode },
        { id: 'status', header: 'Status', render: (r) => r.status },
        { id: 'receipt', header: 'Receipt', render: (r) => r.receiptNumber },
    ];

    return (
        <div className="space-y-4">
            <CustomerCollapsibleSection
                title="Payment Tracking"
                icon={LuCreditCard}
                tone="blue"
                open={trackingOpen}
                onOpenChange={onTrackingOpenChange}
            >
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total amount</p>
                        <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{fmtCurrency(customer.totalAmount)}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Paid amount</p>
                        <p className="mt-1 text-xl font-bold tabular-nums text-emerald-950">{fmtCurrency(customer.paidAmount)}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">Pending amount</p>
                        <p className="mt-1 text-xl font-bold tabular-nums text-amber-950">{fmtCurrency(customer.pendingAmount)}</p>
                    </div>
                </div>
                <div className="px-3 pb-3">
                    <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                        <span>Collection progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[var(--cta-button-bg)]" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                {customer.paymentLink ? (
                    <div className="flex flex-wrap gap-2 px-3 pb-3">
                        <Button variant="company" size="sm" type="button" onClick={() => window.open(customer.paymentLink, '_blank')}>
                            Pay now
                        </Button>
                        <Link
                            href={customer.paymentLink}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--cta-button-bg)] hover:underline"
                        >
                            Payment link <LuExternalLink size={14} />
                        </Link>
                    </div>
                ) : null}
                <div className="px-3 pb-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Payment history</p>
                    <DataTable
                        data={customer.paymentHistory}
                        columns={historyColumns}
                        getRowId={(r) => r.id}
                        sort={{ columnId: null, direction: 'asc' }}
                        onSortChange={() => {}}
                        columnVisibility={{}}
                        columnWidths={{}}
                        onColumnWidthsChange={() => {}}
                        emptyMessage="No payments recorded yet."
                        stickyHeader
                        enableClientSort={false}
                    />
                </div>
            </CustomerCollapsibleSection>
        </div>
    );
}
