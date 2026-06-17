'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LeadDetailMainTabId } from '@/components/leads/detail/leadDetailTabIds';
import {
    LEAD_DETAIL_MORE_TAB_ORDER,
    LEAD_DETAIL_PRIMARY_TAB_ORDER,
} from '@/components/leads/detail/leadDetailTabIds';
import {
    LuBell,
    LuCalendarClock,
    LuChevronDown,
    LuGitBranch,
    LuHandshake,
    LuLayoutGrid,
    LuMapPin,
    LuMessageSquare,
    LuTrendingUp,
    LuUserCheck,
    LuHistory,
} from 'react-icons/lu';
import { CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

const TAB_META: Record<
    LeadDetailMainTabId,
    { label: string; icon: React.ComponentType<{ className?: string; size?: number }> }
> = {
    overview: { label: 'Overview', icon: LuLayoutGrid },
    activity: { label: 'History', icon: LuHistory },
    notes: { label: 'Notes', icon: LuMessageSquare },
    assignment: { label: 'Assignment', icon: LuUserCheck },
    'follow-up': { label: 'Follow-up', icon: LuCalendarClock },
    'site-visit': { label: 'Site Visit', icon: LuMapPin },
    pipeline: { label: 'Pipeline', icon: LuGitBranch },
    conversion: { label: 'Conversion', icon: LuTrendingUp },
    broker: { label: 'Broker', icon: LuHandshake },
    notifications: { label: 'Notifications', icon: LuBell },
};

type LeadMainTabBarProps = {
    active: LeadDetailMainTabId;
    onChange: (id: LeadDetailMainTabId) => void;
};

/** Thin horizontal scrollbar (Firefox + WebKit). */
const scrollNavClass =
    'overflow-x-auto overflow-y-hidden scroll-smooth overscroll-x-contain [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_theme(colors.slate.50)] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400';

const MORE_IDS = new Set<string>(LEAD_DETAIL_MORE_TAB_ORDER);

export function LeadMainTabBar({ active, onChange }: LeadMainTabBarProps) {
    const navRef = useRef<HTMLElement>(null);
    const moreWrapRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    const moreActive = MORE_IDS.has(active);

    const updateScrollHints = useCallback(() => {
        const el = navRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const max = scrollWidth - clientWidth;
        setCanScrollLeft(scrollLeft > 1);
        setCanScrollRight(max > 1 && scrollLeft < max - 1);
    }, []);

    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        updateScrollHints();
        const ro = new ResizeObserver(updateScrollHints);
        ro.observe(el);
        el.addEventListener('scroll', updateScrollHints, { passive: true });
        return () => {
            ro.disconnect();
            el.removeEventListener('scroll', updateScrollHints);
        };
    }, [updateScrollHints]);

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const btn = nav.querySelector<HTMLElement>(`[data-tab-id="${active}"]`);
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        requestAnimationFrame(updateScrollHints);
    }, [active, updateScrollHints]);

    useEffect(() => {
        if (!moreOpen) return;
        const onDoc = (e: MouseEvent) => {
            if (moreWrapRef.current && !moreWrapRef.current.contains(e.target as Node)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [moreOpen]);

    const pickTab = (id: LeadDetailMainTabId) => {
        onChange(id);
        setMoreOpen(false);
    };

    return (
        <div className="sticky top-26 z-40 -mx-6 border-b border-gray-200 bg-white">
            <div className="relative flex min-w-0">
                {canScrollLeft ? (
                    <div
                        className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-linear-to-r from-white to-transparent"
                        aria-hidden
                    />
                ) : null}
                {canScrollRight ? (
                    <div
                        className="pointer-events-none absolute top-0 right-30 z-10 h-full w-8 bg-linear-to-l from-white to-transparent sm:right-33"
                        aria-hidden
                    />
                ) : null}
                <nav
                    ref={navRef}
                    className={cn(
                        'flex min-w-0 flex-1 divide-x divide-gray-200 px-0',
                        scrollNavClass,
                    )}
                    aria-label="Lead record sections"
                >
                    {LEAD_DETAIL_PRIMARY_TAB_ORDER.map((id) => {
                        const item = TAB_META[id];
                        const Icon = item.icon;
                        const isActive = active === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                data-tab-id={id}
                                onClick={() => pickTab(id)}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                    CTA_FOCUS_VISIBLE_RING,
                                    isActive
                                        ? 'font-semibold text-[var(--cta-button-bg)]'
                                        : 'font-medium text-gray-500 hover:text-gray-800',
                                )}
                            >
                                <Icon
                                    size={16}
                                    className={cn('shrink-0', isActive ? 'text-[var(--cta-button-bg)]' : 'opacity-80')}
                                    aria-hidden
                                />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div
                    ref={moreWrapRef}
                    className="relative flex shrink-0 border-l border-gray-200 bg-white shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)]"
                >
                    <button
                        type="button"
                        onClick={() => setMoreOpen((o) => !o)}
                        aria-expanded={moreOpen}
                        aria-haspopup="menu"
                        className={cn(
                            'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                            CTA_FOCUS_VISIBLE_RING,
                            moreActive || moreOpen
                                ? 'font-semibold text-[var(--cta-button-bg)]'
                                : 'font-medium text-gray-500 hover:text-gray-800',
                        )}
                    >
                        More
                        <LuChevronDown
                            size={16}
                            className={cn('shrink-0 opacity-80 transition-transform', moreOpen && 'rotate-180')}
                            aria-hidden
                        />
                    </button>
                    {moreOpen ? (
                        <div
                            role="menu"
                            className="absolute right-0 top-full z-50 mt-0.5 min-w-50 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                        >
                            {LEAD_DETAIL_MORE_TAB_ORDER.map((id) => {
                                const item = TAB_META[id];
                                const Icon = item.icon;
                                const isActive = active === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => pickTab(id)}
                                        className={cn(
                                            'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors',
                                            isActive
                                                ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] font-semibold text-[var(--cta-button-bg)]'
                                                : 'text-gray-700 hover:bg-gray-50',
                                        )}
                                    >
                                        <Icon
                                            size={16}
                                            className={cn(
                                                'shrink-0',
                                                isActive ? 'text-[var(--cta-button-bg)]' : 'text-gray-500',
                                            )}
                                            aria-hidden
                                        />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
