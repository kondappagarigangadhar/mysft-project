'use client';

import type { PurchaseRequestApprovalStatus } from '@/lib/purchaseRequestStore';
import { cn } from '@/lib/utils';
import { LuBadgeCheck, LuClock3, LuUser } from 'react-icons/lu';

function approvalBadge(status: PurchaseRequestApprovalStatus) {
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (status === 'Approved') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (status === 'Rejected') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
}

export function PrApprovalTimelinePanel({
    status,
    approvedBy,
    approvalDateFormatted,
    remarks,
    isCreate,
}: {
    status: PurchaseRequestApprovalStatus;
    approvedBy: string;
    approvalDateFormatted: string;
    remarks: string;
    isCreate: boolean;
}) {
    const activityLine =
        status === 'Approved' && approvedBy.trim()
            ? `Approved by ${approvedBy.trim()}${approvalDateFormatted !== '—' ? ` on ${approvalDateFormatted}` : ''}`
            : status === 'Rejected'
              ? `Rejected${approvedBy.trim() ? ` by ${approvedBy.trim()}` : ''}${approvalDateFormatted !== '—' ? ` on ${approvalDateFormatted}` : ''}`
              : isCreate
                ? 'Approval workflow starts after the request is saved.'
                : 'Pending approval — awaiting reviewer action.';

    return (
        <div className="border-t border-gray-200/80 bg-slate-50/40 px-3 py-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Approval timeline</p>
                <span className={approvalBadge(isCreate ? 'Pending' : status)}>{isCreate ? 'Pending' : status}</span>
            </div>
            <div className="relative pl-6">
                <span className="absolute left-2 top-1 bottom-1 w-px bg-slate-200" aria-hidden />
                <div className="space-y-3">
                    <div className="relative">
                        <span className="absolute -left-4 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white">
                            <LuClock3 className="h-3 w-3 text-slate-500" />
                        </span>
                        <p className="text-xs font-semibold text-slate-800">Submitted for approval</p>
                        <p className="text-[11px] text-slate-500">Request captured and routed to approver queue.</p>
                    </div>
                    <div className="relative">
                        <span
                            className={cn(
                                'absolute -left-4 top-1 flex h-5 w-5 items-center justify-center rounded-full border bg-white',
                                status === 'Approved'
                                    ? 'border-emerald-200 text-emerald-700'
                                    : status === 'Rejected'
                                      ? 'border-rose-200 text-rose-700'
                                      : 'border-amber-200 text-amber-700',
                            )}
                        >
                            <LuBadgeCheck className="h-3 w-3" />
                        </span>
                        <p className="text-xs font-semibold text-slate-800">
                            {status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Pending approval'}
                        </p>
                        <p className="text-[11px] text-slate-600">{activityLine}</p>
                    </div>
                    {remarks.trim() ? (
                        <div className="relative">
                            <span className="absolute -left-4 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white">
                                <LuUser className="h-3 w-3 text-slate-500" />
                            </span>
                            <p className="text-xs font-semibold text-slate-800">Approval notes</p>
                            <p className="text-[11px] leading-relaxed text-slate-600">{remarks}</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
