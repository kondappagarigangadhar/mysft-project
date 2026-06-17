'use client';

import React, { useMemo, useState } from 'react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import StatusBadge from '@/components/ui/StatusBadge';
import { getMockBills } from '@/modules/resident-portal/services/mockResidentData';
import type { Bill } from '@/modules/resident-portal/utils/types';
import { formatShortDate } from '@/modules/resident-portal/utils/date';
import { ResidentCard } from '@/modules/resident-portal/components/ResidentCard';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import { ResidentPageHeader, ResidentPageShell } from '@/modules/resident-portal/components/ResidentPageShell';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import { LuCreditCard, LuDownload, LuHistory, LuShieldCheck } from 'react-icons/lu';

export default function ResidentBillingPage() {
    const seed = useMemo(() => getMockBills(), []);
    const [bills, setBills] = useState<Bill[]>(seed);
    const [autoPay, setAutoPay] = useState(false);
    const [isPaying, setIsPaying] = useState<string | null>(null);

    const payNow = (billId: string) => {
        setIsPaying(billId);
        setTimeout(() => {
            setBills((prev) =>
                prev.map((b) =>
                    b.id === billId
                        ? {
                              ...b,
                              status: 'Paid',
                              paidAt: new Date().toISOString(),
                              receiptId: `RCT-${Math.floor(10000 + Math.random() * 89999)}`,
                          }
                        : b,
                ),
            );
            setIsPaying(null);
        }, 900);
    };

    const outstanding = bills.find((b) => b.status !== 'Paid');

    return (
        <ResidentPageShell>
            <ResidentPageHeader
                icon={<LuCreditCard className="h-5 w-5" aria-hidden />}
                title="Billing & payments"
                subtitle="Secure payments · UPI, cards, and netbanking"
            />

            <ResidentCard variant="welcome" padding="md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-[rgba(0,0,0,0.55)]">Amount due</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-[rgba(0,0,0,0.9)] sm:text-3xl">
                            ₹{(outstanding?.total ?? 0).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-[rgba(0,0,0,0.6)]">
                            {outstanding
                                ? `Due by ${formatShortDate(outstanding.dueDate)} · ${outstanding.monthLabel}`
                                : 'All payments are up to date.'}
                        </p>
                        {outstanding ? (
                            <p className="mt-2 text-xs text-[rgba(0,0,0,0.45)]">
                                Maintenance ₹{outstanding.maintenance.toLocaleString()} · Utilities ₹
                                {outstanding.utilities.toLocaleString()}
                            </p>
                        ) : null}
                    </div>
                    {outstanding ? (
                        <button
                            type="button"
                            disabled={isPaying === outstanding.id}
                            onClick={() => payNow(outstanding.id)}
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#0a66c2] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-1"
                        >
                            <LuCreditCard className="h-4 w-4" aria-hidden />
                            {isPaying === outstanding.id ? 'Processing…' : 'Pay now'}
                        </button>
                    ) : null}
                </div>

                <div className="mt-4 border-t border-[#ebebeb] pt-4">
                    <ToggleSwitch
                        checked={autoPay}
                        onCheckedChange={setAutoPay}
                        label="Auto-pay"
                        description={autoPay ? 'Monthly dues on due date' : 'Pay automatically each month'}
                    />
                </div>
            </ResidentCard>

            <SectionCard
                title="Payment history"
                subtitle={`${bills.length} ${bills.length === 1 ? 'bill' : 'bills'}`}
                accent="emerald"
                icon={<LuHistory className="h-4 w-4" />}
                bodyClassName="p-0"
            >
                <ul className={residentSectionFeedList}>
                    {bills.map((b) => (
                        <li key={b.id}>
                            <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 mx-3 lg:mx-0">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{b.monthLabel}</p>
                                    <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.55)]">
                                        Due {formatShortDate(b.dueDate)} · ₹{b.total.toLocaleString()}
                                    </p>
                                    {b.receiptId ? (
                                        <p className="mt-1 text-xs text-[rgba(0,0,0,0.45)]">{b.receiptId}</p>
                                    ) : null}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <StatusBadge status={b.status} />
                                    {b.status === 'Paid' ? (
                                        <button
                                            type="button"
                                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#e0dfdc] bg-white transition-colors hover:border-[#d0cfcc] hover:bg-[#f8f8f6]"
                                            aria-label={`Download receipt ${b.receiptId}`}
                                        >
                                            <LuDownload className="h-4 w-4 text-[rgba(0,0,0,0.6)]" aria-hidden />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </SectionCard>

            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[rgba(0,0,0,0.45)]">
                <LuShieldCheck className="h-3.5 w-3.5 text-[#057642]" aria-hidden />
                Payments are encrypted and processed securely
            </p>
        </ResidentPageShell>
    );
}
