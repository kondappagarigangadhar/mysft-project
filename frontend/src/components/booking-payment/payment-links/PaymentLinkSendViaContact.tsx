'use client';

import React from 'react';
import { getBookingBySlug, type PaymentLinkSendVia } from '@/lib/bookingPaymentMockStore';
import { getLeads } from '@/lib/leadStore';

function getLeadEmailByBookingLeadId(leadId: string): string | undefined {
    const m = /^AR-(\d+)$/i.exec(leadId.trim());
    if (!m) return undefined;
    const id = Number(m[1]);
    return getLeads().find((l) => l.id === id)?.email;
}

function phoneDigits10(phone: string): string {
    return phone.replace(/\D/g, '').slice(-10);
}

export function PaymentLinkSendViaContact({
    bookingSlug,
    sendVia,
}: {
    bookingSlug: string;
    sendVia: PaymentLinkSendVia | undefined;
}) {
    const b = getBookingBySlug(bookingSlug);
    const mode = sendVia ?? 'Email & SMS';
    const email = b ? getLeadEmailByBookingLeadId(b.leadId) : undefined;
    const digits = b ? phoneDigits10(b.phone) : '';
    const phonePretty = digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : (b?.phone ?? '').trim();

    if (!b) return <span className="text-sm text-slate-500">—</span>;

    const phoneOk = digits.length === 10;

    if (mode === 'Email') {
        return email ? (
            <p className="text-sm text-slate-800">
                <span className="text-slate-500">Email </span>
                {email}
            </p>
        ) : (
            <p className="text-xs text-amber-800">No email on file for this lead.</p>
        );
    }

    if (mode === 'SMS') {
        return phoneOk ? (
            <p className="text-sm text-slate-800">
                <span className="text-slate-500">SMS </span>
                <span className="font-mono tabular-nums">{phonePretty}</span>
            </p>
        ) : (
            <p className="text-xs text-slate-500">Phone missing or invalid.</p>
        );
    }

    if (mode === 'WhatsApp') {
        return phoneOk ? (
            <p className="text-sm text-slate-800">
                <span className="text-slate-500">WhatsApp </span>
                <span className="font-mono tabular-nums">{phonePretty}</span>
            </p>
        ) : (
            <p className="text-xs text-slate-500">Phone missing or invalid.</p>
        );
    }

    if (mode === 'Email & SMS') {
        return (
            <div className="space-y-1 text-sm text-slate-800">
                {email ? (
                    <p>
                        <span className="text-slate-500">Email </span>
                        {email}
                    </p>
                ) : (
                    <p className="text-xs text-amber-800">No email on file.</p>
                )}
                {phoneOk ? (
                    <p>
                        <span className="text-slate-500">SMS </span>
                        <span className="font-mono tabular-nums">{phonePretty}</span>
                    </p>
                ) : (
                    <p className="text-xs text-slate-500">SMS phone missing.</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-1 text-sm text-slate-800">
            {email ? (
                <p>
                    <span className="text-slate-500">Email </span>
                    {email}
                </p>
            ) : (
                <p className="text-xs text-amber-800">No email on file.</p>
            )}
            {phoneOk ? (
                <p>
                    <span className="text-slate-500">Phone </span>
                    <span className="font-mono tabular-nums">{phonePretty}</span>
                </p>
            ) : (
                <p className="text-xs text-slate-500">Phone missing.</p>
            )}
        </div>
    );
}
