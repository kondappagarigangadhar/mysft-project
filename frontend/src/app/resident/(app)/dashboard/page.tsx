'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { getMockBills, getMockNotices, getMockTickets } from '@/modules/resident-portal/services/mockResidentData';
import { KpiCard } from '@/modules/resident-portal/components/KpiCard';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import { ResidentCard, ResidentFeedItem } from '@/modules/resident-portal/components/ResidentCard';
import { ResidentRightRailWidgets } from '@/modules/resident-portal/components/ResidentRightRailWidgets';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatShortDate } from '@/modules/resident-portal/utils/date';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import {
    LuBell,
    LuCalendarClock,
    LuCheck,
    LuCreditCard,
    LuPlus,
    LuTicket,
    LuWrench,
} from 'react-icons/lu';

export default function ResidentDashboardPage() {
    const { currentResident } = useResidentSession();
    const bills = useMemo(() => getMockBills(), []);
    const tickets = useMemo(() => getMockTickets(), []);
    const notices = useMemo(() => getMockNotices(), []);

    const outstanding = bills.find((b) => b.status !== 'Paid');
    const outstandingAmount = outstanding ? outstanding.total : 0;
    const openTickets = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length;
    const firstName = currentResident?.fullName?.split(' ')[0] ?? 'Resident';
    const needsPayment = outstandingAmount > 0;

    return (
        <div className="mx-auto w-full space-y-3 sm:space-y-4 lg:max-w-[680px] xl:max-w-[800px]">
            {/* Welcome */}
            <ResidentCard variant="welcome" padding="md" className="sm:rounded-xl">
                <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0a66c2] text-sm font-semibold text-white sm:h-14 sm:w-14 sm:text-base">
                        {firstName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 w-full">
                        <h1 className="text-base font-semibold text-[rgba(0,0,0,0.9)] sm:text-lg md:text-xl">
                            Hi {firstName}, here&apos;s your overview
                        </h1>
                        <p className="mt-1.5 text-sm leading-relaxed text-[rgba(0,0,0,0.6)]">
                            {needsPayment ? (
                                <>
                                    You have{' '}
                                    <span className="font-semibold text-[rgba(0,0,0,0.9)]">
                                        ₹{outstandingAmount.toLocaleString()}
                                    </span>{' '}
                                    outstanding
                                    {outstanding ? ` · due ${formatShortDate(outstanding.dueDate)}` : ''}
                                </>
                            ) : (
                                'All payments are up to date. You’re good to go.'
                            )}
                        </p>
                        <div className="mt-4 flex flex-col gap-2 border-t border-[#ebebeb] pt-4 sm:flex-row sm:flex-wrap sm:gap-2.5">
                            <Link
                                href="/resident/maintenance"
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#e0dfdc] px-4 text-sm font-semibold text-[rgba(0,0,0,0.6)] transition-colors hover:border-[#d0cfcc] hover:bg-[#f3f2ef] hover:text-[rgba(0,0,0,0.9)] sm:h-9 sm:w-auto"
                            >
                                <LuPlus className="h-4 w-4" aria-hidden />
                                Raise complaint
                            </Link>
                            <Link
                                href="/resident/billing"
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#0a66c2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#004182] sm:h-9 sm:w-auto"
                            >
                                <LuCreditCard className="h-4 w-4" aria-hidden />
                                Pay dues
                            </Link>
                        </div>
                    </div>
                </div>
            </ResidentCard>

            {/* KPI metrics */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
                <KpiCard
                    title="Dues"
                    value={`₹${outstandingAmount.toLocaleString()}`}
                    helper={outstanding ? `Due ${formatShortDate(outstanding.dueDate)}` : 'Clear'}
                    href="/resident/billing"
                    icon={<LuCreditCard className="h-5 w-5" />}
                    tone="orange"
                />
                <KpiCard
                    title="Tickets"
                    value={String(openTickets)}
                    helper="Open requests"
                    href="/resident/maintenance"
                    icon={<LuWrench className="h-5 w-5" />}
                    tone="blue"
                />
                <KpiCard
                    title="Bookings"
                    value="1"
                    helper="This week"
                    href="/resident/amenities"
                    icon={<LuCalendarClock className="h-5 w-5" />}
                    tone="violet"
                />
                <KpiCard
                    title="Notices"
                    value={String(notices.length)}
                    helper="Unread"
                    href="/resident/notices"
                    icon={<LuBell className="h-5 w-5" />}
                    tone="emerald"
                />
            </div>

            {/* Recent payments feed */}
            <SectionCard
                title="Recent payments"
                subtitle="Billing activity"
                accent="blue"
                icon={<LuCreditCard className="h-4 w-4" />}
                action={
                    <Link href="/resident/billing" className="text-xs font-semibold text-[#0a66c2] hover:underline sm:text-sm">
                        View all
                    </Link>
                }
            >
                <ul className={residentSectionFeedList}>
                    {bills.map((bill) => (
                        <li key={bill.id}>
                            <ResidentFeedItem>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <div
                                            className={
                                                bill.status === 'Paid'
                                                    ? 'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#c8e6d4] bg-[#e3f2ea] text-[#057642]'
                                                    : 'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#f5dcc8] bg-[#fef0e3] text-[#c45d0a]'
                                            }
                                        >
                                            {bill.status === 'Paid' ? (
                                                <LuCheck className="h-4 w-4" aria-hidden />
                                            ) : (
                                                <LuCreditCard className="h-4 w-4" aria-hidden />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">
                                                {bill.monthLabel} maintenance
                                            </p>
                                            <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.6)]">
                                                Due {formatShortDate(bill.dueDate)}
                                                {bill.receiptId ? ` · Receipt ${bill.receiptId}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center justify-between gap-3 sm:block sm:text-right">
                                        <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">
                                            ₹{bill.total.toLocaleString()}
                                        </p>
                                        <p
                                            className={
                                                bill.status === 'Paid'
                                                    ? 'text-xs font-medium text-[#057642]'
                                                    : 'text-xs font-medium text-[#e0680a]'
                                            }
                                        >
                                            {bill.status}
                                        </p>
                                    </div>
                                </div>
                            </ResidentFeedItem>
                        </li>
                    ))}
                </ul>
            </SectionCard>

            {/* Maintenance activities feed */}
            <SectionCard
                title="Maintenance activities"
                subtitle="Active service requests"
                accent="amber"
                icon={<LuWrench className="h-4 w-4" />}
                action={
                    <Link href="/resident/maintenance" className="text-xs font-semibold text-[#0a66c2] hover:underline sm:text-sm">
                        View all
                    </Link>
                }
            >
                <ul className={residentSectionFeedList}>
                    {tickets.slice(0, 2).map((t) => (
                        <li key={t.id}>
                            <ResidentFeedItem>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{t.category}</p>
                                        <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.6)] line-clamp-2 sm:line-clamp-1">{t.description}</p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="inline-flex items-center gap-1 rounded-md border border-[#f5dcc8] bg-[#fef0e3] px-2 py-0.5 text-xs font-medium text-[#9a4a0a]">
                                                <LuTicket className="h-3.5 w-3.5" aria-hidden />
                                                {t.id}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-md border border-[#e8e8e6] bg-[#f3f2ef] px-2 py-0.5 text-xs font-medium text-[rgba(0,0,0,0.6)]">
                                                {t.assignedVendorName ?? 'Assigning…'}
                                            </span>
                                            {t.eta ? (
                                                <span className="rounded-md border border-[#e8e8e6] bg-[#f3f2ef] px-2 py-0.5 text-xs font-medium text-[rgba(0,0,0,0.6)]">
                                                    ETA {t.eta}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="self-start sm:shrink-0">
                                        <StatusBadge status={t.status} />
                                    </div>
                                </div>
                            </ResidentFeedItem>
                        </li>
                    ))}
                </ul>
            </SectionCard>

            {/* Community notices feed */}
            <SectionCard
                title="Resident notices"
                subtitle="Community updates"
                accent="emerald"
                icon={<LuBell className="h-4 w-4" />}
                action={
                    <Link href="/resident/notices" className="text-xs font-semibold text-[#0a66c2] hover:underline sm:text-sm">
                        View all
                    </Link>
                }
            >
                <ul className={residentSectionFeedList}>
                    {notices.slice(0, 3).map((n) => (
                        <li key={n.id}>
                            <ResidentFeedItem>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                                    <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{n.title}</p>
                                    {n.pinned ? (
                                        <span className="shrink-0 rounded-md border border-[#c8e6d4] bg-[#e3f2ea] px-2 py-0.5 text-xs font-medium text-[#057642]">
                                            Pinned
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-1.5 text-sm leading-relaxed text-[rgba(0,0,0,0.6)] line-clamp-2">{n.content}</p>
                                <p className="mt-1.5 text-xs text-[rgba(0,0,0,0.45)]">{n.category}</p>
                            </ResidentFeedItem>
                        </li>
                    ))}
                </ul>
            </SectionCard>

            {/* Mobile / tablet widgets — mirrors right rail on smaller screens */}
            <div className="space-y-2 xl:hidden">
                <ResidentRightRailWidgets className="space-y-3" />
            </div>
        </div>
    );
}
