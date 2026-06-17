'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { PaymentLinkDisplayStatus } from '@/lib/bookingPaymentMockStore';
import { LuBan, LuCircleCheck, LuCircleX, LuClock, LuClockAlert } from 'react-icons/lu';

export function PaymentLinkStatusBadge({
    status,
    hoursToExpiry,
}: {
    status: PaymentLinkDisplayStatus;
    /** Only for Active links — used for <24h warning */
    hoursToExpiry?: number;
}) {
    const urgent = status === 'Active' && hoursToExpiry !== undefined && hoursToExpiry > 0 && hoursToExpiry <= 24;

    const cfg: Record<
        PaymentLinkDisplayStatus,
        { label: string; className: string; icon: React.ReactNode }
    > = {
        Active: {
            label: urgent ? 'Active · expires soon' : 'Active',
            className: urgent
                ? 'bg-amber-50 text-amber-900 ring-amber-200'
                : 'bg-emerald-50 text-emerald-900 ring-emerald-200',
            icon: urgent ? <LuClockAlert size={14} className="shrink-0" /> : <LuClock size={14} className="shrink-0" />,
        },
        Paid: {
            label: 'Paid',
            className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
            icon: <LuCircleCheck size={14} className="shrink-0" />,
        },
        Expired: {
            label: 'Expired',
            className: 'bg-red-50 text-red-800 ring-red-200',
            icon: <LuCircleX size={14} className="shrink-0" />,
        },
        Cancelled: {
            label: 'Cancelled',
            className: 'bg-slate-100 text-slate-700 ring-slate-200',
            icon: <LuBan size={14} className="shrink-0" />,
        },
    };

    const c = cfg[status];
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset',
                c.className
            )}
        >
            {c.icon}
            {c.label}
        </span>
    );
}
