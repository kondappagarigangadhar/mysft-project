'use client';

import React from 'react';
import { BpStatusBadge, installmentStatusTone } from '@/components/booking-payment/BpStatusBadge';
import { AISmartTooltip } from '@/components/ai/AISmartTooltip';
import type { InstallmentTrackRow, PaymentPlan } from '@/lib/bookingPaymentMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { cn } from '@/lib/utils';

function milestonePct(plan: PaymentPlan | null, milestoneId: string): string {
    if (!plan) return '—';
    const m = plan.milestones.find((x) => x.id === milestoneId);
    return m ? `${m.percentageOfTotal.toFixed(1)}%` : '—';
}

export function InstallmentTrackingTable({
    rows,
    plan,
    loading,
}: {
    rows: InstallmentTrackRow[];
    plan: PaymentPlan | null;
    loading?: boolean;
}) {
    if (loading) {
        return (
            <div className="overflow-x-auto rounded-xl border border-slate-200 -mx-1 animate-pulse" aria-busy="true">
                <div className="h-40 min-w-[720px] bg-slate-100" />
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
                <p className="text-sm font-semibold text-slate-700">No milestones for this booking</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Select a booking that has a payment plan to see installment tracking here.
                </p>
            </div>
        );
    }

    return (
        <div className="relative overflow-x-auto rounded-xl border border-slate-200 shadow-sm -mx-1">
            <table className="w-full min-w-[720px] text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500">
                        <th className="px-3 py-2.5 font-medium">Milestone</th>
                        <th className="px-3 py-2.5 font-medium">%</th>
                        <th className="px-3 py-2.5 font-medium text-right">Expected</th>
                        <th className="px-3 py-2.5 font-medium text-right">Paid</th>
                        <th className="px-3 py-2.5 font-medium text-right">Pending</th>
                        <th className="px-3 py-2.5 font-medium">Due</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => {
                        const overdue = r.overdueDays > 0 && r.status !== 'Completed';
                        const risky = overdue || (r.pendingAmount > 0 && r.status !== 'Completed');
                        const riskTip = overdue
                            ? `Overdue by ${r.overdueDays}d — higher collection risk.`
                            : r.pendingAmount > 0 && r.status !== 'Completed'
                              ? 'Outstanding balance — monitor for delay before due date.'
                              : 'On track for this milestone.';
                        const dotClass =
                            overdue || (r.pendingAmount > 0 && r.status !== 'Completed')
                                ? 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.35)]'
                                : 'bg-emerald-500';
                        return (
                            <tr
                                key={r.milestoneId}
                                className={cn(
                                    'bg-white hover:bg-slate-50/80',
                                    overdue && 'bg-red-50/50 hover:bg-red-50/70',
                                    risky && 'ring-2 ring-inset ring-red-500',
                                )}
                            >
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <AISmartTooltip
                                            label={riskTip}
                                            triggerClassName="border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
                                        >
                                            <span className={cn('inline-block h-2 w-2 rounded-full', dotClass)} />
                                        </AISmartTooltip>
                                        <span className="text-slate-900">{r.milestoneName}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-3 tabular-nums text-slate-600">{milestonePct(plan, r.milestoneId)}</td>
                                <td className="px-3 py-3 text-right tabular-nums text-slate-800">
                                    ₹{r.expectedAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-right tabular-nums text-slate-800">
                                    ₹{r.paidAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-right tabular-nums text-slate-800">
                                    ₹{r.pendingAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                                    {formatShortDate(r.dueDate)}
                                    {overdue && (
                                        <span className="ml-2 text-xs text-red-700">({r.overdueDays}d late)</span>
                                    )}
                                </td>
                                <td className="px-3 py-3">
                                    <BpStatusBadge tone={installmentStatusTone(r.status)}>{r.status}</BpStatusBadge>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
