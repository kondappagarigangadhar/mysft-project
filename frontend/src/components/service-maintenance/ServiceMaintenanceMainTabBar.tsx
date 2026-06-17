'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ServiceMaintenanceTabId } from '@/components/service-maintenance/serviceMaintenanceDetailTabIds';
import { SERVICE_MAINTENANCE_PRIMARY_TAB_ORDER } from '@/components/service-maintenance/serviceMaintenanceDetailTabIds';
import { LuHistory, LuLayoutGrid } from 'react-icons/lu';
import { CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

const TAB_META: Record<ServiceMaintenanceTabId, { label: string; icon: typeof LuLayoutGrid }> = {
    overview: { label: 'Overview', icon: LuLayoutGrid },
    activity: { label: 'History', icon: LuHistory },
};

const scrollNavClass =
    'overflow-x-auto overflow-y-hidden scroll-smooth overscroll-x-contain [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_theme(colors.slate.50)] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400';

type Props = {
    active: ServiceMaintenanceTabId;
    onChange: (id: ServiceMaintenanceTabId) => void;
};

export function ServiceMaintenanceMainTabBar({ active, onChange }: Props) {
    const navRef = useRef<HTMLElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

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

    return (
        <div className="sticky top-26 z-40 -mx-6 border-b border-gray-200 bg-white">
            <div className="relative flex min-w-0">
                {canScrollLeft ? (
                    <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-linear-to-r from-white to-transparent" aria-hidden />
                ) : null}
                {canScrollRight ? (
                    <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-linear-to-l from-white to-transparent" aria-hidden />
                ) : null}
                <nav
                    ref={navRef}
                    className={cn('flex min-w-0 flex-1 divide-x divide-gray-200 px-0', scrollNavClass)}
                    aria-label="Service ticket sections"
                >
                    {SERVICE_MAINTENANCE_PRIMARY_TAB_ORDER.map((id) => {
                        const item = TAB_META[id];
                        const Icon = item.icon;
                        const isActive = active === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                data-tab-id={id}
                                onClick={() => onChange(id)}
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
            </div>
        </div>
    );
}
