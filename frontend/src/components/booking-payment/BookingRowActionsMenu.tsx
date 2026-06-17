'use client';

import React from 'react';
import { LuArrowRight, LuEye, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM_BLOCK } from '@/lib/theme/ctaThemeClasses';

export type BookingRowPaymentActions = {
    onAddPayment: (slug: string) => void;
    onOpenLedger: (slug: string) => void;
};

export type BookingRowBookingActions = {
    onView: (slug: string) => void;
    onEdit: (slug: string) => void;
    onDelete: (slug: string) => void;
};

export function BookingRowActionsMenu({
    slug,
    paymentActions,
    bookingActions,
}: {
    slug: string;
    paymentActions?: BookingRowPaymentActions;
    bookingActions?: BookingRowBookingActions;
}) {
    const nPay = paymentActions ? 2 : 0;
    const nBook = bookingActions ? 3 : 0;
    const estimated = 52 * (nPay + nBook) + (paymentActions && bookingActions ? 24 : 0) + 40;

    return (
        <PortaledRowActionsMenu estimatedMenuHeight={estimated} minMenuWidth={228}>
            {({ close }) => (
                <>
                    {paymentActions ? (
                        <>
                            <button
                                type="button"
                                className={CTA_MENU_ITEM_BLOCK}
                                onClick={() => {
                                    close();
                                    paymentActions.onAddPayment(slug);
                                }}
                            >
                                <LuPlus size={16} className="text-emerald-600" />
                                Add payment
                            </button>
                            <button
                                type="button"
                                className={CTA_MENU_ITEM_BLOCK}
                                onClick={() => {
                                    close();
                                    paymentActions.onOpenLedger(slug);
                                }}
                            >
                                <LuArrowRight size={16} className="text-[var(--cta-button-bg)]" />
                                Open payment ledger
                            </button>
                        </>
                    ) : null}
                    {paymentActions && bookingActions ? <div className="my-1 border-t border-slate-100" /> : null}
                    {bookingActions ? (
                        <>
                            <button
                                type="button"
                                className={CTA_MENU_ITEM_BLOCK}
                                onClick={() => {
                                    close();
                                    bookingActions.onView(slug);
                                }}
                            >
                                <LuEye size={16} className="text-slate-400" />
                                View
                            </button>
                            <button
                                type="button"
                                className={CTA_MENU_ITEM_BLOCK}
                                onClick={() => {
                                    close();
                                    bookingActions.onEdit(slug);
                                }}
                            >
                                <LuPencil size={16} className="text-slate-400" />
                                Edit
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                    close();
                                    bookingActions.onDelete(slug);
                                }}
                            >
                                <LuTrash2 size={16} />
                                Delete booking
                            </button>
                        </>
                    ) : null}
                </>
            )}
        </PortaledRowActionsMenu>
    );
}
