'use client';

import React from 'react';
import { ResidentWidget, ResidentFeedItem } from '../components/ResidentCard';
import { residentWidgetFeedList } from '../styles/cardStyles';
import {
    LuBell,
    LuCalendarDays,
    LuMegaphone,
    LuPhone,
    LuWrench,
    LuCreditCard,
    LuUsers,
} from 'react-icons/lu';

const notificationStyles = {
    maintenance: { icon: LuWrench, bg: 'bg-[#fef0e3]', border: 'border-[#f5dcc8]', text: 'text-[#c45d0a]' },
    payments: { icon: LuCreditCard, bg: 'bg-[#e8f1fb]', border: 'border-[#d4e4f2]', text: 'text-[#0a66c2]' },
    community: { icon: LuUsers, bg: 'bg-[#e3f2ea]', border: 'border-[#c8e6d4]', text: 'text-[#057642]' },
} as const;

export function ResidentRightRailWidgets({ className }: { className?: string }) {
    return (
        <div className={className}>
            <ResidentWidget
                title="Notifications"
                subtitle="Latest updates"
                accent="blue"
                icon={<LuBell className="h-3.5 w-3.5" />}
            >
                <ul className={residentWidgetFeedList}>
                    {(
                        [
                            { type: 'maintenance' as const, title: 'Maintenance', text: 'Lift service at 6:00 PM' },
                            { type: 'payments' as const, title: 'Payments', text: 'Dues due in 3 days' },
                            { type: 'community' as const, title: 'Community', text: 'Pool closed Sunday AM' },
                        ] as const
                    ).map((n) => {
                        const style = notificationStyles[n.type];
                        const Icon = style.icon;
                        return (
                            <li key={n.title}>
                                <ResidentFeedItem size="widget">
                                    <div className="flex items-start gap-2.5">
                                        <div
                                            className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${style.border} ${style.bg} ${style.text}`}
                                        >
                                            <Icon className="h-3.5 w-3.5" aria-hidden />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-[rgba(0,0,0,0.9)]">{n.title}</p>
                                            <p className="mt-0.5 text-[11px] leading-snug text-[rgba(0,0,0,0.55)]">
                                                {n.text}
                                            </p>
                                        </div>
                                    </div>
                                </ResidentFeedItem>
                            </li>
                        );
                    })}
                </ul>
            </ResidentWidget>

            <ResidentWidget
                title="Upcoming events"
                subtitle="This week"
                accent="violet"
                icon={<LuCalendarDays className="h-3.5 w-3.5" />}
            >
                <ul className={residentWidgetFeedList}>
                    {[
                        { title: 'Summer gathering', day: 'Sun', when: '6:00 PM' },
                        { title: 'Fire drill', day: 'Wed', when: '10:00 AM' },
                    ].map((e) => (
                        <li key={e.title}>
                            <ResidentFeedItem size="widget">
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-[#ddd0f5] bg-[#ede8fb] text-[#6d28d9]">
                                        <span className="text-[9px] font-semibold uppercase leading-none">{e.day}</span>
                                        <span className="mt-0.5 text-[10px] font-medium leading-none opacity-70">
                                            {e.when}
                                        </span>
                                    </div>
                                    <div className="min-w-0 pt-0.5">
                                        <p className="text-xs font-semibold text-[rgba(0,0,0,0.9)]">{e.title}</p>
                                        <p className="mt-0.5 text-[11px] text-[rgba(0,0,0,0.55)]">
                                            {e.day} · {e.when}
                                        </p>
                                    </div>
                                </div>
                            </ResidentFeedItem>
                        </li>
                    ))}
                </ul>
            </ResidentWidget>

            <ResidentWidget
                title="Community updates"
                subtitle="Building announcements"
                accent="emerald"
                icon={<LuMegaphone className="h-3.5 w-3.5" />}
            >
                <ul className={residentWidgetFeedList}>
                    {[
                        { title: 'Water supply maintenance', when: 'Fri 10 AM – 12 PM' },
                        { title: 'Parking policy reminder', when: 'Posted today' },
                    ].map((u) => (
                        <li key={u.title}>
                            <ResidentFeedItem size="widget">
                                <p className="text-xs font-semibold text-[rgba(0,0,0,0.9)]">{u.title}</p>
                                <span className="mt-1.5 inline-block rounded-md border border-[#c8e6d4] bg-[#e3f2ea] px-2 py-0.5 text-[10px] font-medium text-[#057642]">
                                    {u.when}
                                </span>
                            </ResidentFeedItem>
                        </li>
                    ))}
                </ul>
            </ResidentWidget>

            <ResidentWidget
                title="Emergency contacts"
                subtitle="Available 24/7"
                accent="rose"
                icon={<LuPhone className="h-3.5 w-3.5" />}
            >
                <ul className={residentWidgetFeedList}>
                    {[
                        { label: 'Security', value: '+919000000001', display: '+91 90000 00001' },
                        { label: 'Reception', value: '+919000000002', display: '+91 90000 00002' },
                        { label: 'Fire safety', value: '+919000000003', display: '+91 90000 00003' },
                    ].map((c) => (
                        <li key={c.label}>
                            <ResidentFeedItem size="widget">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-[rgba(0,0,0,0.85)]">{c.label}</span>
                                    <a
                                        href={`tel:${c.value}`}
                                        className="inline-flex items-center gap-1 rounded-md border border-[#f5d0d0] bg-[#fce8e8] px-2 py-1 text-[11px] font-medium text-[#b91c1c] transition-colors hover:border-[#eab8b8] hover:bg-[#fad4d4]"
                                    >
                                        <LuPhone className="h-3 w-3 shrink-0" aria-hidden />
                                        {c.display}
                                    </a>
                                </div>
                            </ResidentFeedItem>
                        </li>
                    ))}
                </ul>
            </ResidentWidget>
        </div>
    );
}
