'use client';

import React, { useMemo, useState } from 'react';
import { getMockNotices } from '@/modules/resident-portal/services/mockResidentData';
import type { Notice } from '@/modules/resident-portal/utils/types';
import { formatShortDate } from '@/modules/resident-portal/utils/date';
import { ResidentCard } from '@/modules/resident-portal/components/ResidentCard';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import {
    ResidentPageHeader,
    ResidentPageShell,
    residentChipActiveClass,
    residentChipInactiveClass,
    residentInputClass,
} from '@/modules/resident-portal/components/ResidentPageShell';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import { cn } from '@/lib/utils';
import {
    LuBell,
    LuCalendarDays,
    LuCreditCard,
    LuDownload,
    LuMegaphone,
    LuPin,
    LuSearch,
    LuShield,
    LuUsers,
    LuWrench,
} from 'react-icons/lu';

const CATS: Array<Notice['category'] | 'All'> = ['All', 'Community', 'Maintenance', 'Events', 'Security', 'Payments'];

const categoryStyles: Record<
    Notice['category'],
    { icon: React.ComponentType<{ className?: string }>; badge: string; iconBox: string }
> = {
    Community: {
        icon: LuUsers,
        badge: 'border border-[#e8e8e6] bg-[#f3f2ef] text-[rgba(0,0,0,0.7)]',
        iconBox: 'border border-[#e8e8e6] bg-[#f3f2ef] text-[rgba(0,0,0,0.6)]',
    },
    Maintenance: {
        icon: LuWrench,
        badge: 'border border-[#d4e4f2] bg-[#e8f1fb] text-[#0a66c2]',
        iconBox: 'border border-[#d4e4f2] bg-[#e8f1fb] text-[#0a66c2]',
    },
    Events: {
        icon: LuCalendarDays,
        badge: 'border border-[#c8e6d4] bg-[#e3f2ea] text-[#057642]',
        iconBox: 'border border-[#c8e6d4] bg-[#e3f2ea] text-[#057642]',
    },
    Security: {
        icon: LuShield,
        badge: 'border border-[#f5d0d0] bg-[#fce8e8] text-[#b91c1c]',
        iconBox: 'border border-[#f5d0d0] bg-[#fce8e8] text-[#b91c1c]',
    },
    Payments: {
        icon: LuCreditCard,
        badge: 'border border-[#f5dcc8] bg-[#fef0e3] text-[#c45d0a]',
        iconBox: 'border border-[#f5dcc8] bg-[#fef0e3] text-[#c45d0a]',
    },
};

function NoticeItem({ notice }: { notice: Notice }) {
    const style = categoryStyles[notice.category];
    const Icon = style.icon;

    return (
        <article className="px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg', style.iconBox)}>
                    <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', style.badge)}>
                            {notice.category}
                        </span>
                        {notice.pinned ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#f5dcc8] bg-[#fef0e3] px-2 py-0.5 text-xs font-medium text-[#c45d0a]">
                                <LuPin className="h-3 w-3" aria-hidden />
                                Pinned
                            </span>
                        ) : null}
                        <span className="text-xs text-[rgba(0,0,0,0.45)]">{formatShortDate(notice.createdAt)}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-[rgba(0,0,0,0.9)] sm:text-base">{notice.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[rgba(0,0,0,0.6)]">{notice.content}</p>

                    {notice.attachments?.length ? (
                        <div className="mt-3 rounded-lg border border-[#ebebeb] bg-[#fafafa] p-3">
                            <p className="text-xs font-semibold text-[rgba(0,0,0,0.75)]">Attachments</p>
                            <div className="mt-2 space-y-1.5">
                                {notice.attachments.map((a) => (
                                    <button
                                        key={a.name}
                                        type="button"
                                        className="flex w-full items-center justify-between gap-2 rounded-md border border-[#e0dfdc] bg-white px-3 py-2 text-left text-sm font-medium text-[rgba(0,0,0,0.9)] transition-colors hover:border-[#d0cfcc] hover:bg-[#f8f8f6]"
                                    >
                                        <span className="truncate">{a.name}</span>
                                        <LuDownload className="h-4 w-4 shrink-0 text-[rgba(0,0,0,0.45)]" aria-hidden />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export default function ResidentNoticesPage() {
    const seed = useMemo(() => getMockNotices(), []);
    const [q, setQ] = useState('');
    const [cat, setCat] = useState<(typeof CATS)[number]>('All');

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return seed
            .filter((n) => (cat === 'All' ? true : n.category === cat))
            .filter((n) => (!needle ? true : `${n.title} ${n.content}`.toLowerCase().includes(needle)))
            .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
    }, [seed, q, cat]);

    const pinned = filtered.filter((n) => n.pinned);
    const regular = filtered.filter((n) => !n.pinned);

    return (
        <ResidentPageShell>
            <ResidentPageHeader
                icon={<LuMegaphone className="h-5 w-5" aria-hidden />}
                title="Community notices"
                subtitle="Pinned announcements, attachments, and building alerts."
            />

            <ResidentCard padding="md">
                <div className="relative">
                    <LuSearch
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.45)]"
                        aria-hidden
                    />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search notices…"
                        className={residentInputClass}
                    />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {CATS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCat(c)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                                cat === c ? residentChipActiveClass : residentChipInactiveClass,
                            )}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </ResidentCard>

            {filtered.length === 0 ? (
                <ResidentCard padding="lg" className="text-center">
                    <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-[#e8e8e6] bg-[#f3f2ef] text-[rgba(0,0,0,0.5)]">
                        <LuBell className="h-5 w-5" aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[rgba(0,0,0,0.9)]">No notices found</p>
                    <p className="mt-1 text-sm text-[rgba(0,0,0,0.55)]">Try a different search or category filter.</p>
                </ResidentCard>
            ) : null}

            {pinned.length > 0 ? (
                <SectionCard
                    title="Pinned"
                    subtitle={`${pinned.length} important ${pinned.length === 1 ? 'notice' : 'notices'}`}
                    accent="amber"
                    icon={<LuPin className="h-4 w-4" />}
                    bodyClassName="p-0"
                >
                    <ul className={residentSectionFeedList}>
                        {pinned.map((n) => (
                            <li key={n.id}>
                                <NoticeItem notice={n} />
                            </li>
                        ))}
                    </ul>
                </SectionCard>
            ) : null}

            {regular.length > 0 ? (
                <SectionCard
                    title="All notices"
                    subtitle={`${regular.length} ${regular.length === 1 ? 'update' : 'updates'}`}
                    accent="emerald"
                    icon={<LuMegaphone className="h-4 w-4" />}
                    bodyClassName="p-0"
                >
                    <ul className={residentSectionFeedList}>
                        {regular.map((n) => (
                            <li key={n.id}>
                                <NoticeItem notice={n} />
                            </li>
                        ))}
                    </ul>
                </SectionCard>
            ) : null}
        </ResidentPageShell>
    );
}
