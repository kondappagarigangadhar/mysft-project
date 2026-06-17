'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HISTORY_TAB_DEFINITIONS, parseHistoryModuleParam } from '@/lib/historyLogs/urlModule';
import { CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import { LuChevronLeft, LuChevronRight, LuScrollText } from 'react-icons/lu';

const BASE = '/company-admin/history-logs';
const SCROLL_STEP = 220;

/** Scroll via arrows only — no visible horizontal scrollbar */
const scrollNavClass =
    'overflow-x-auto overflow-y-hidden scroll-smooth overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function hrefForTab(id: (typeof HISTORY_TAB_DEFINITIONS)[number]['id']): string {
    if (id === 'all') return BASE;
    return `${BASE}?module=${id}`;
}

const scrollArrowBtn =
    'inline-flex h-11 w-9 shrink-0 items-center justify-center self-end border-slate-200 bg-white text-slate-500 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] hover:text-[var(--cta-button-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-35';

export function HistoryLogTabs() {
    const searchParams = useSearchParams();
    const active = parseHistoryModuleParam(searchParams.get('module'));
    const navRef = useRef<HTMLElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);

    const updateScrollHints = useCallback(() => {
        const el = navRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const max = scrollWidth - clientWidth;
        setHasOverflow(max > 1);
        setCanScrollLeft(scrollLeft > 1);
        setCanScrollRight(max > 1 && scrollLeft < max - 1);
    }, []);

    const scrollTabs = useCallback((direction: 'left' | 'right') => {
        const el = navRef.current;
        if (!el) return;
        const delta = direction === 'left' ? -SCROLL_STEP : SCROLL_STEP;
        el.scrollBy({ left: delta, behavior: 'smooth' });
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
        const tab = nav.querySelector<HTMLElement>(`[data-tab-id="${active}"]`);
        tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        requestAnimationFrame(updateScrollHints);
    }, [active, updateScrollHints]);

    return (
        <div className="w-full rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex min-w-0 items-end border-b border-slate-200/80">
                {hasOverflow ? (
                    <button
                        type="button"
                        aria-label="Scroll module tabs left"
                        disabled={!canScrollLeft}
                        className={cn(scrollArrowBtn, 'border-r', CTA_FOCUS_VISIBLE_RING)}
                        onClick={() => scrollTabs('left')}
                    >
                        <LuChevronLeft size={18} aria-hidden />
                    </button>
                ) : null}

                <div className="relative min-w-0 flex-1">
                    {canScrollLeft ? (
                        <div
                            className="pointer-events-none absolute top-0 left-0 z-10 h-full w-6 bg-linear-to-r from-white to-transparent"
                            aria-hidden
                        />
                    ) : null}
                    {canScrollRight ? (
                        <div
                            className="pointer-events-none absolute top-0 right-0 z-10 h-full w-6 bg-linear-to-l from-white to-transparent"
                            aria-hidden
                        />
                    ) : null}
                    <nav
                        ref={navRef}
                        className={cn('flex min-w-0 gap-0', scrollNavClass)}
                        role="tablist"
                        aria-label="History by module"
                    >
                        {HISTORY_TAB_DEFINITIONS.map((t) => {
                            const isActive = t.id === active || (t.id === 'all' && active === 'all');
                            return (
                                <Link
                                    key={t.id}
                                    href={hrefForTab(t.id)}
                                    scroll={false}
                                    role="tab"
                                    data-tab-id={t.id}
                                    aria-selected={isActive}
                                    className={cn(
                                        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                        CTA_FOCUS_VISIBLE_RING,
                                        isActive
                                            ? 'border-[var(--cta-button-bg)] font-semibold text-[var(--cta-button-bg)]'
                                            : 'border-transparent font-medium text-gray-500 hover:border-slate-200 hover:text-gray-800',
                                    )}
                                >
                                    {t.id === 'all' ? (
                                        <LuScrollText
                                            size={16}
                                            className={cn('shrink-0', isActive ? 'text-[var(--cta-button-bg)]' : 'opacity-80')}
                                            aria-hidden
                                        />
                                    ) : null}
                                    {t.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {hasOverflow ? (
                    <button
                        type="button"
                        aria-label="Scroll module tabs right"
                        disabled={!canScrollRight}
                        className={cn(scrollArrowBtn, 'border-l', CTA_FOCUS_VISIBLE_RING)}
                        onClick={() => scrollTabs('right')}
                    >
                        <LuChevronRight size={18} aria-hidden />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
