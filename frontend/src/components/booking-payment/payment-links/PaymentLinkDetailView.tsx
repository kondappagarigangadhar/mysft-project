'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { PaymentLinkSendViaContact } from '@/components/booking-payment/payment-links/PaymentLinkSendViaContact';
import { PaymentLinkStatusBadge } from '@/components/booking-payment/payment-links/PaymentLinkStatusBadge';
import {
    getEffectivePaymentLinkDisplayStatus,
    getHoursToExpiryEnd,
    getPaymentLinkBookingParty,
    type PaymentLinkRecord,
} from '@/lib/bookingPaymentMockStore';
import { LuBan, LuCopy, LuTrash2 } from 'react-icons/lu';

export function PaymentLinkDetailView({
    link,
    onCopyUrl,
    onCancel,
    onDelete,
}: {
    link: PaymentLinkRecord;
    onCopyUrl: (url: string) => void;
    onCancel: () => void;
    onDelete: () => void;
}) {
    const disp = getEffectivePaymentLinkDisplayStatus(link);
    const hrs = link.linkStatus === 'active' ? getHoursToExpiryEnd(link.expiryDate) : undefined;
    const showCancel = link.linkStatus === 'active';
    const showDelete = link.linkStatus !== 'paid';
    const party = getPaymentLinkBookingParty(link.bookingSlug);

    return (
        <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
                <PaymentLinkStatusBadge status={disp} hoursToExpiry={hrs} />
            </div>
            <dl className="space-y-3 rounded-xl border border-slate-100 p-4 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <dt className="text-xs font-semibold text-slate-500 shrink-0">Payment Link ID</dt>
                    <dd className="font-mono text-xs text-slate-900 text-right break-all">{link.slug}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <dt className="text-xs font-semibold text-slate-500 shrink-0">Booking ID</dt>
                    <dd className="font-mono text-xs text-slate-900 text-right break-all">{link.bookingSlug}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <dt className="text-xs font-semibold text-slate-500 shrink-0">Customer</dt>
                    <dd className="text-right font-medium text-slate-900">{party.customerName}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <dt className="text-xs font-semibold text-slate-500 shrink-0">Lead</dt>
                    <dd className="text-right text-sm text-slate-800">{party.leadSummary}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <dt className="text-xs font-semibold text-slate-500 shrink-0">Payment Amount</dt>
                    <dd className="font-bold text-slate-900">₹{link.amount.toLocaleString('en-IN')}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <dt className="text-xs font-semibold text-slate-500 shrink-0">Expiry Date</dt>
                    <dd className="text-slate-900 font-medium tabular-nums">{link.expiryDate}</dd>
                </div>
                <div className="pt-1 border-t border-slate-100">
                    <dt className="text-xs font-semibold text-slate-500 mb-1.5">Payment Link URL</dt>
                    <dd className="font-mono text-xs">
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={link.url}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono min-w-0"
                            />
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="shrink-0 px-3"
                                onClick={() => onCopyUrl(link.url)}
                            >
                                <LuCopy size={16} />
                            </Button>
                        </div>
                    </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <dt className="text-xs font-semibold text-slate-500 shrink-0">Send Via</dt>
                    <dd className="text-slate-900 font-medium text-right">{link.sendVia ?? 'Email & SMS'}</dd>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <dt className="text-xs font-semibold text-slate-500">Customer Contact</dt>
                    <dd className="m-0">
                        <PaymentLinkSendViaContact bookingSlug={link.bookingSlug} sendVia={link.sendVia} />
                    </dd>
                </div>
            </dl>
            <div className="flex flex-col gap-2">
                {showCancel ? (
                    <Button
                        type="button"
                        variant="companyGhost"
                        size="cta"
                        className="w-full text-rose-700 border border-rose-200 hover:bg-rose-50"
                        onClick={onCancel}
                    >
                        <LuBan className="mr-2" size={16} />
                        Cancel link
                    </Button>
                ) : null}
                {showDelete ? (
                    <Button
                        type="button"
                        variant="companyGhost"
                        size="cta"
                        className="w-full text-rose-800 border border-rose-200 hover:bg-rose-50"
                        onClick={onDelete}
                    >
                        <LuTrash2 className="mr-2" size={16} />
                        Delete link
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
